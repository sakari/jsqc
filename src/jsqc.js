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
		    integer : function() {
			this.copy = function(value) {
			     return value;
			},
			this.generate = function() {return 0;};
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
					value + 
					' error:' + 
					x);
		    }
		}
	    };
})();