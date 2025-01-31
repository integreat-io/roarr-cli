import prettyjson from 'prettyjson';
import {
  getLogLevelName,
} from 'roarr';
import type {
  Message,
} from 'roarr';
import split from 'split2';
import type {
  LogFormatterConfigurationType,
} from '../types';
import {
  formatInvalidInputMessage,
  isRoarrLine,
} from '../utilities';

export const createLogFormatter = (configuration: LogFormatterConfigurationType) => {
  const {
    chalk,
    includeDate,
    outputFormat,
  } = configuration;

  const logLevelColorMap = {
    debug: chalk.gray,
    error: chalk.red,
    fatal: chalk.red,
    info: chalk.cyan,
    trace: chalk.gray,
    warn: chalk.yellow,
  };

  const formatMessage = (message: Message): string => {
    let formattedMessage = '';

    if (includeDate) {
      formattedMessage = '[' + new Date(message.time).toISOString() + ']';
    } else {
      formattedMessage = '[' + new Date().toISOString().slice(11, -1) + ']';
    }

    if (message.context.logLevel && typeof message.context.logLevel === 'number') {
      const logLevelName = getLogLevelName(message.context.logLevel);

      const logLevelColorName = logLevelColorMap[logLevelName];

      if (!logLevelColorName) {
        throw new Error('Unexpected state.');
      }

      if (message.context.logLevel % 10 === 0) {
        formattedMessage += ' ' + logLevelColorName(logLevelName);
      } else {
        formattedMessage += ' ' + logLevelColorName(logLevelName + ' (' + String(message.context.logLevel) + ')');
      }
    }

    if (message.context.package) {
      formattedMessage += ' @' + String(message.context.package);
    }

    if (message.context.program) {
      formattedMessage += ' %' + String(message.context.program);
    }

    if (message.context.namespace) {
      formattedMessage += ' #' + String(message.context.namespace);
    }

    formattedMessage += ': ' + message.message + '\n';

    if (message.context && outputFormat === 'pretty') {
      /* eslint-disable @typescript-eslint/no-unused-vars */
      const {
        application: temporary0,
        hostname: temporary1,
        instanceId: temporary2,
        logLevel: temporary3,
        namespace: temporary4,
        package: temporary5,
        program: temporary6,
        ...rest
      } = message.context;

      /* eslint-enable @typescript-eslint/no-unused-vars */

      if (Object.keys(rest).length) {
        formattedMessage += String(prettyjson.render(rest, {
          noColor: !configuration.useColors,
        })) + '\n\n';
      }
    }

    return formattedMessage;
  };

  return split((line) => {
    if (!isRoarrLine(line)) {
      return line + '\n';
    }

    try {
      return formatMessage(JSON.parse(line));
    } catch (error) {
      return formatInvalidInputMessage(chalk, error, line);
    }
  });
};
