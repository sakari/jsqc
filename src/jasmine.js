(function(){
     var Property = function(env, suite, description, generators, property) {
	 this._env = env;
	 this._suite = suite;
	 this._description = description;
	 this._property = property;
	 this._generators = generators;
	 jasmine.Spec.call(this, env, suite);
	 this.runs(property);
     };
     jasmine.util.inherit(Property, jasmine.Spec);
     Property.prototype.execute = function(on_complete) {
	 jasmine.Spec.prototype.execute.call(this, on_complete);
     };

     jasmine.Env.prototype.property = function(description) {
	 var generators = [];
	 for(var i = 1; i < arguments.length -1; i++) {
	     generators.push(arguments[i]);
	 }
	 var property = arguments[arguments.length - 1];
	 var prop = new Property(this, 
				 this.currentSuite, 
				 description, 
				 generators,
				 property);
	 this.currentSuite.add(prop);
	 this.currentSpec = prop;
	 return prop;
     };
 })();
