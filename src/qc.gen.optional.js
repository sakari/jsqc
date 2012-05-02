qc.gen.optional = function(generator) {
    function optional() {
	this._inner = new (qc.gen.oneof([qc.gen.const(undefined), 
					 generator]))();
    }
    optional.prototype.value = function() {
	return this._inner.value();
    };
    optional.prototype.show = function() {
	return this._inner.show();
    };
    optional.prototype.next = function() {
	return new optional();
    };
    optional.prototype.shrink = function() {
	return this._inner.shrink();
    };
    return optional;
};