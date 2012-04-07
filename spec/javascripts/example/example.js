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
	     
 	     property('qc finds an order of async events to trigger failure', 
	     	      function() {
	     		  var order = [];
	     		  this.qc.event('first', function() { order.push('first'); });
	     		  this.qc.event('second', function() { order.push('second'); });
	     		  this.qc.event('third', function() { order.push('third'); });
	     		  this.qc.waitsFor(function() { return order.length; });
	     		  expect(order).not.toEqual(['third', 'first']);
	     	      });

	     property('qc finds the minimal set af async evens to trigger failure',
		     function() {
			 var order = [];
			 this.qc.event('first', function() { order.push('first'); } );
			 this.qc.event('second', function() { order.push('second'); } );
			 this.qc.event('third', function() { order.push('third'); } );
			 this.qc.waitsFor(function() { return order.length; });
			 expect(order).not.toContain('third');
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