const Joi = require('joi-browser');

// define validation for all the env vars
const envVarsSchema = Joi.object({
  NODE_ENV: Joi.string()
    .allow(['development', 'production', 'test', 'provision'])
    .default('development'),
  PUBLIC_URL: Joi.string().allow('').required(),
  REACT_APP_AUTH_TOKEN: Joi.string().required(),
  REACT_APP_TINGG_WS: Joi.string().required(),
  REACT_APP_PIANO_THING_ID: Joi.string().uuid().required(),
  REACT_APP_OTHER_THING_ID: Joi.string().uuid().required(),
}).unknown()
  .required();

const { error, value: envVars } = Joi.validate(process.env, envVarsSchema);
if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export default {
  env: envVars.NODE_ENV,
  publicUrl: envVars.PUBLIC_URL,
  authToken: envVars.REACT_APP_AUTH_TOKEN,
  tinggWS: envVars.REACT_APP_TINGG_WS,
  pianoThingId: envVars.REACT_APP_PIANO_THING_ID,
  otherThingId: envVars.REACT_APP_OTHER_THING_ID,
};
