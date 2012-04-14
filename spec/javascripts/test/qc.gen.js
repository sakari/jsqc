describe('qc.gen', function() {
	     describe('qc.gen.integer', function() {
			  qc.gen.interface(qc.gen.integer,
					   function(v) {
					       return _.isNumber(v) &&
						   Math.floor(v) === v;
					   }
					  );
		      });
	 });