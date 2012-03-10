jsqc = (function() {

	    function minimize(last_failing, prop) {
		if(!last_failing.shrink)
		    return next;

		var candidates = last_failing.shrink();
		for( var i in candidates ) {
		    try {
			prop(candidates[i].value());
		    } catch (x) {
			last_failing = candidates[i];
			candidates = candidates[i].shrink();
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
			return function inner_array (size, _opts) {
			    var value = ( _opts.value === undefined ? 
					  generate():
					  _opts.value
					);

			    this.value = function() {
				return _.map(value, function(i) {
						 return i.value();
					     });				
			    };
			    this.shrink = function() {
				if (value.length === 0)
				    return [];
				return _.map(_.last(value).shrink(), 
					     function(s) {
						 return new inner_array(1, { value: _.initial(value).concat([s])});
					     }).concat([new inner_array(1, { value: _.initial(value) })]);
			    };
			    function generate() {
				var n = Math.abs(new jsqc.gen.integer(size, {}).value());
				var array = [];
				while(n-- > 0) {
				    array.push(new inner(size, {}));
				} 
				return array;
			    };
			};
		    },
		    integer : function(size, _opts) {
			size = size || 1;
			var value = (_opts.value === undefined ? 
				     generate() :
				     _opts.value);

			this.shrink = function() {
			    if (value === 0)
				return [];
			    if (value < 0)
				return [new jsqc.gen.integer(size, 
							     { value : value + 1})];
			    return [new jsqc.gen.integer(size, 
							 { value : value - 1})];
			};
			this.show = function() {
			  return value.toString();  
			};
			this.value = function() {
			    return value;
			};
			this.next = function() {
			   return new jsqc.gen.integer(size * 2, {}); 
			};
			function generate () {
			    return Math.floor(Math.random() * size);
			};
		    }
		},
		property : function(gen, prop) {
		    var generator = new gen(1, {});
		    try {
			prop(generator.value());
		    } catch (x) {
			var min = minimize(generator, prop);
			throw new Error('Failing case ' + 
					generator.show() + 
					' error:' + e 
					);
		    }
		}
	    };
})();