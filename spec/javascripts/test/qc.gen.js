describe('qc.gen', function() {
	     describe('qc.gen.integer', function() {
			  qc.gen.interface(qc.gen.integer,
					   function(v) {
					       return _.isNumber(v) &&
						   Math.floor(v) === v;
					   }
					  );
		      });
	     
	     describe('qc.gen.map', function() {
			  qc.gen.interface(qc.gen.map(
					       qc.gen.integer,
					       qc.gen.integer), 
					   function(v) {
					       return _.all(v, 
							    function(val, key) {
								console.log(val, key);
								return _.isNumber(val) &&
								    _.isString(key);
							    });
					   });
		      });
	 });