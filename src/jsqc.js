jsqc = (function() {

	    function minimize(generator, prop, starting_value) {
		if(!generator.shrink)
		    return starting_value;

		var last_failing = starting_value;
		var candidates = generator.shrink(starting_value);
		for( var i in candidates ) {
		    try {
			prop(generator.copy(candidates[i]));
		    } catch (x) {
			last_failing = candidates[i];
			candidates = generator.shrink(candidates[i]);
		    }
		}
		return last_failing;
	    }

	    return {
		gen : {
		    oneof : function(gens) {
			var generators = [];
			for(var i in gens) {
			    generators.push(new gens[i]());
			}
			return function() {
			    this.generate = function() {
				var choice = new (jsqc.gen.choice(generators))();
				return choice.generate().generate();
			    };
			    this.shrink = function() { 
				return []; 
			    };
			};
		    },
		    choice : function(values, gen) {
			return function() {
			    this.generate = function() {
				var i = Math.floor(Math.random() * values.length);
				return values[i];
			    };
			    this.copy = function(value) {
				if(gen)
				    return new gen().copy(value);
				return value;
			    };
			    this.shrink = function() {
				return [];
			    };
			};
		    },
		    const : function(value) {
			return function() {
			    this.generate = function() {
				return value;
			    };
			    this.copy = function() {
				return value;
			    };
			    this.shrink = function() {
				return [];
			    };
			};
		    },
		    array : function(inner) {
			return function() {
			    var inner_gen = new inner();
			    this.copy = function(value) {
				var newValue = [];
				for(var i in value) {
				    newValue.push(inner_gen.copy(value[i]));
				};
				return newValue;
			    };
			    this.shrink = function(value) {
				if (value.length == 0)
				    return [];
				var head = value[value.length - 1];
				var result = [];
				for(var i in inner_gen.shrink(head)) {
				    var heads = this.copy(value);
				    heads[heads.length - 1] = inner_gen.shrink(head)[i];
				    result.push(heads);
				}
				var smaller = this.copy(value);
				smaller.pop();
				result.push(smaller);
				return result;
			    };
			    this.generate = function() {
				var n = new jsqc.gen.integer().generate();
				var array = [];
				while(n > 0) {
				    array.push(i.generate());
				    n--;
				} 
				return array;
			    };
			};
		    },
		    integer : function() {
			var size = 1;
			this.shrink = function(value) {
			    if (value === 0)
				return [];
			    if (value < 0)
				return [value + 1];
			    return [value - 1];
			};
			this.show = function(value) {
			  return value.toString();  
			};
			this.copy = function(value) {
			     return value;
			};
			this.generate = function() {
			    var r = Math.random() * size;
			    size *= 2;
			    return Math.floor(r);
			};
		    }
		},
		property : function(gen, prop) {
		    var generator = new gen();
		    var value = generator.generate();
		    try {
			prop(generator.copy(value));
		    } catch (x) {
			value = minimize(generator, prop, value);
			throw new Error('Failing case ' + 
					generator.show(value) + 
					' error:' + 
					x);
		    }
		}
	    };
})();