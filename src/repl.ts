import * as repl from 'repl';

import { INestApplication } from '@nestjs/common';

import * as models from './models';
import { DatabaseService } from './modules';
import { NamedLogger } from './utils';

interface ReplOptions {
  app?: INestApplication;
}

export function startRepl(options: ReplOptions = {}): repl.REPLServer {
  const logger = new NamedLogger('Repl');
  logger.info(`Repl interface enabled: Starting...`);
  logger.info(` Globals available to you:`);
  logger.info(
    ` $ app\tThe nest app instance (if APi is enabled, otherwise undefined)`,
  );
  logger.info(` $ knex\tKnex instance to the database for running queries`);
  logger.info(` $ models\tObjection models. ex: "models.NAME.query()"`);
  logger.info(
    ` $ a\t\tA function you can pass anything into and it will log resolved promise values.`,
  );
  logger.info(` \t\t\tEx. "a(models.NAME.query());`);

  if (!models.BaseModel.knex()) {
    // Only REPL was enabled on startup, this means we want to create a DB connection for REPL usage
    logger.verbose(
      'Knex instance not detected, creating a database service for use in the Repl',
    );
    new DatabaseService();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const additionalContext: any = {
    app: options.app,
  };
  additionalContext.models = models;
  additionalContext.knex = models.BaseModel.knex();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  additionalContext.a = (...args: any[]) => {
    if (args) {
      console.time('Promise time:');
      const result = Promise.all(args);
      result.then((data) => {
        console.log(...data);
        console.timeEnd('Promise time:');
        additionalContext.a.data = data.length === 1 ? data[0] : data;
      });
      return `After result is logged, the data will be available in "a.data"`;
    }
  };

  const replServer = repl.start({
    breakEvalOnSigint: true,
    prompt: '',
  });
  replServer.on('exit', async () => {
    if (options.app) {
      await options.app.close();
    }
    await DatabaseService.closeKnex();
  });
  Object.assign(replServer.context, additionalContext);

  return replServer;
}
