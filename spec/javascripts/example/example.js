describe('example suite', function() {
	     var before;
	     beforeEach(function() {
			before = true;    
			});
	     it('wooga', function(){
		    expect(true).toEqual(true);
		});
	     property('does not hold ever', function() {
	     		  expect(true).toEqual(false);
	     	      });
	     property('tautologies hold always', function() {
	     		  expect(true).toEqual(true);
	     	      });

	     property('does not hold for some input', 
	     	      qc.gen.integer,
	     	      function(i) {
	     		  expect(i).toBeLessThan(10);
	     	      });

	     property('reverse of concatenation of arrays is equal to concatenation of reversed arrays', 
	     	      qc.gen.array(qc.gen.integer), 
	     	      qc.gen.array(qc.gen.integer),
	     	      function(left, right) {
	     		  //Note the slices, suprisingly to me reverse
	     		  //mutates the underlying array. It pays to
	     		  //test.
	     		  expect(right.slice().reverse().concat(left.slice().reverse()))
	     		      .toEqual(left.concat(right).reverse());
	     	      });
	 });