/**
 * @file BaseService.gs
 * @description Classe base para serviços do SGAE (SRP - Single Responsibility)
 */

function BaseService(dependencies) {
  this.dependencies = dependencies || {};
}

BaseService.prototype.execute = function(params) {
  try {
    this.validateParams(params);
    return this._execute(params);
  } catch (error) {
    this.handleError(error);
    throw error;
  }
};

BaseService.prototype.validateParams = function(params) {
  // Override in subclasses if needed
};

BaseService.prototype._execute = function(params) {
  throw new Error('Method must be implemented by subclass');
};

BaseService.prototype.handleError = function(error) {
  Logger.log('Service error : ' + error.message);
  // Override in subclasses for specific error handling
};

BaseService.prototype.getDependency = function(name) {
  if (!this.dependencies[name]) {
    throw new Error('Dependency not found : ' + name);
  }
  return this.dependencies[name];
};
