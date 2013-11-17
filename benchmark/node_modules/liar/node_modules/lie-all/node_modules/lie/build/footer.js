		return exports;
	};

	if(typeof define === 'function'){
		define(function(){
			return create(typeof setImmediate === 'function'?setImmediate:setTimeout,{});
		});
	}else if(typeof module === 'undefined' || !('exports' in module)){
		create(typeof setImmediate === 'function'?setImmediate:setTimeout,typeof global === 'object' && global ? global : this);
	}else{
		module.exports = create(process.nextTick,{});
	}
})();
