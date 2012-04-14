# QuickCheck for javascript

```javascript
   describe('arrays', function() {
        property('reverse of concatenation of arrays is equal to concatenation of reversed arrays',
        qc.gen.array(qc.gen.integer),
        qc.gen.array(qc.gen.integer),
        function(left, right) {
            expect(right.slice().reverse().concat(left.slice().reverse()))
                .toEqual(left.concat(right).reverse());
            });
	});
```

Framework for randomized test data generation for javascript in the footsteps of Claessen and Hughes with crappy [Jasmine](http://pivotal.github.com/jasmine) integration. See `spec/javascripts/example/example.js` for usage examples.

For general introduction to QuickCheck a good starting point could be [wikipedia] (http://en.wikipedia.org/wiki/QuickCheck).

## Features

 * Genarates test data with increasing size
 * Shrinking of failing inputs to smaller counterexamples
 * Randomized execution of asynchronous events with minimization for counterexample execution orders
 * Integration with [Jasmine framework](http://pivotal.github.com/jasmine) (output is crappy but it generally seems to work)

## Test data generators

The core of qc.js are the test data generators. The generators are responsible for producing the values passed to the property predicate.

Test data generators passed to `property` must satisfy the interface defined in `src/qc.gen.interface.js` for everything to work. See `spec/javascripts/test.qc.gen.js` for examples on how to make sure of it. To produce test data with increasing size you can query the current test size with `qc.size()` and bake that into the test value.

## Dependencies

 * [async.js](https://github.com/caolan/async)
 * [underscore.js](https://github.com/documentcloud/underscore/)

See `spec/javascripts/lib` for details.

## Contributing

Send a pull request. Please do not use camel case. You should be able to run the included jasmine testsuite with the help of the [jasmine gem](https://github.com/pivotal/jasmine-gem). The examples suite contains examples of failing cases otherwise everything should pass.

## License

Copyright Sakari Jokinen. This program is free software. You may do whatever you want to do with it. The software comes without any warranty, to the extent permitted by applicable law.


