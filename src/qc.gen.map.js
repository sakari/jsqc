qc.gen.map = function(key_generator, value_generator) {
    function map() {
	var self = this;
	this._value = [];
	_.times(Math.abs(new qc.gen.integer().value()),
		function() {
		   self._value.push(
		       {
			   key: new (qc.gen.optional(key_generator))(),
			   value: new value_generator()
		       });
		});
    }
    map.prototype._map = function(key_map, value_map) {
	return _.reduce(this._value, 
			function(o, v) {
			    var key = key_map(v.key);
			    if (key !== undefined)
				o[key] = value_map(v.value);
			    return o;
			}, 
			{});
    };
    map.prototype.value = function() {
	this._map(function(v) { return v.value(); },
		  function(v) { return v.value(); });
    };
    map.prototype.shrink = function() {
	return _.map(self._values, function(v, i) {
			 v.key.shrink();
			 v.value.shrink();
		     });
    };
    map.prototype.show = function() {
	return JSON.stringify(this._map(function(v) { return v.show(); },
					function(v) {
					    return v.show();
					}
				       ));
    };
    map.prototype.next = function() {
	return new map();
    };
    return map;
}