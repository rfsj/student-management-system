module.exports = {
  default: {
    require: ['ts-node/register', 'features/step_definitions/**/*.ts'],
    paths: ['features/**/*.feature'],
    format: ['progress'],
    publishQuiet: true
  }
};
