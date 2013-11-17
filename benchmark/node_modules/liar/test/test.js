'use strict';
var promise = require('../lib');
require("mocha-as-promised")();
var chai = require("chai");
chai.should();
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
describe("Use with Chai as Promised", function() {
  it(".should.be.fulfilled", function() {
    return promise.resolve().should.be.fulfilled;
  });
  it(".should.be.rejected", function() {
    return promise.reject().should.be.rejected;
  });
  it(".should.be.rejected.with(TypeError, 'boo')", function() {
    return promise.reject(new TypeError("boo!")).should.be.rejectedWith(TypeError, "boo");
  });
  it(".should.become(5)", function() {
    return promise.resolve(5).should.become(5);
  });
  return it(".should.eventually.be.above(2)", function() {
    return promise.resolve(5).should.eventually.be.above(2);
  });
});
describe("Use with Chai as Promised in the other style", function() {
  it(".should.be.fulfilled", function() {
    return promise(function(yes){
        yes();
    }).then().should.be.fulfilled;
  });
  it(".should.be.rejected", function() {
    return promise(function(yes,no){
        no();
    }).then().should.be.rejected;
  });
  it(".should.be.rejected.with(TypeError, 'boo')", function() {
    return promise(function(yes,no){
        no(new TypeError("boo!"));
    }).should.be.rejectedWith(TypeError, "boo");
  });
  it(".should.be.rejected.with(TypeError, 'boo')", function() {
    return promise(function(yes,no){
       throw new TypeError("boo!");
    }).should.be.rejectedWith(TypeError, "boo");
  });
  it(".should.be.rejected.with(TypeError, 'boo') in a then", function() {
    return promise(function(yes){
        yes();
    }).then(function(){
        throw new TypeError("boo!");
    }).should.be.rejectedWith(TypeError, "boo");
  });
  it(".should.become(5)", function() {
     return promise(function(yes){
        yes(5);
    }).should.become(5);
  });
   it(".should.become(5) after a timeout", function() {
     return promise(function(yes){
        setTimeout(function(){
            yes(5);
       },100)
    }).then().should.become(5);
  });
  return it(".should.eventually.be.above(2)", function() {
    return promise(function(yes){
        yes(5);
    }).should.eventually.be.above(2);
  });
});
describe("all", function() {
    it('should work',function(){
        return promise.all([promise.resolve(1),promise.resolve(3),promise.resolve(5),promise.resolve(7),promise.resolve(9)]).should.become([1,3,5,7,9]);
    });
    it('should work mixed',function(){
        return promise.all([promise.resolve(1),3,promise.resolve(5),promise.resolve(7),promise.resolve(9)]).should.become([1,3,5,7,9]);
    });
    it('should reject',function(){
        return promise.all([promise.resolve(1),promise.reject(3),promise.resolve(5),promise.resolve(7),promise.resolve(9)]).should.be.rejected.and.become(3)
    });
    it('should work with nested values',function(){
        return promise.all([promise.resolve(promise.resolve(1)),promise.resolve(3),promise.resolve(5),promise.resolve(7),promise.resolve(9)]).should.become([1,3,5,7,9]);
    });
    it('should work with very nested values',function(){
        return promise.all([promise.resolve().then(function(){
            return promise.resolve(1);
        }),promise.resolve(3),promise.resolve(5),promise.resolve(7),promise.resolve(9)]).should.become([1,3,5,7,9]);
    });
});
describe("some", function() {
    it('should work',function(){
        var a = promise.some([promise.resolve(1),promise.resolve(3),promise.resolve(5),promise.resolve(7),promise.resolve(9)]);
        return promise.all([a.should.eventually.include.members([1,3,5,7,9]),a.should.eventually.have.length(5)]);
    });
    it('should work mixed',function(){
        var a = promise.some([promise.resolve(1),3,promise.resolve(5),promise.resolve(7),promise.resolve(9)]);
        return promise.all([a.should.eventually.include.members([1,3,5,7,9]),a.should.eventually.have.length(5)]);
    });
    it('should work with a rejection',function(){
        var a = promise.some([promise.resolve(1),promise.reject(3),promise.resolve(5),promise.resolve(7),promise.resolve(9)]);
        return promise.all([a.should.eventually.include.members([1,5,7,9]),a.should.eventually.have.length(4)]);
    });
    it('should work with nested values',function(){
        var a = promise.some([promise.resolve(promise.resolve(1)),promise.resolve(3),promise.resolve(5),promise.resolve(7),promise.resolve(9)]);
        return promise.all([a.should.eventually.include.members([1,3,5,7,9]),a.should.eventually.have.length(5)]);
    });
    it('should work with very nested values',function(){
        var a = promise.some([promise.resolve().then(function(){
            return promise.resolve(1);
        }),promise.resolve(3),promise.resolve(5),promise.resolve(7),promise.resolve(9)]);
        return promise.all([a.should.eventually.include.members([1,3,5,7,9]),a.should.eventually.have.length(5)]);
    });
    it('should work when all are rejected',function(){
         var a = promise.some([promise.reject(1),promise.reject(3),promise.reject(5),promise.reject(7),promise.reject(9)]);
        return promise.all([a.should.be.rejected.and.eventually.include.members([1,3,5,7,9]),a.should.be.rejected.and.eventually.have.length(5)]);
    });
    it('should work when all are rejected including a thrown then',function(){
         var a = promise.some([promise.resolve().then(function(){
            throw 1;
        }),promise.reject(3),promise.reject(5),promise.reject(7),promise.reject(9)]);
        return promise.all([a.should.be.rejected.and.eventually.include.members([1,3,5,7,9]),a.should.be.rejected.and.eventually.have.length(5)]);
    });
    it('should work when all are rejected including a nested one',function(){
         var a = promise.some([promise.resolve().then(function(){
            return promise.reject(1);
        }),promise.reject(3),promise.reject(5),promise.reject(7),promise.reject(9)]);
        return promise.all([a.should.be.rejected.and.eventually.include.members([1,3,5,7,9]),a.should.be.rejected.and.eventually.have.length(5)]);
    });
});
describe("map", function() {
    describe('with values',function(){
        function loveNumbers(n){
            if(n.then && typeof n.then === 'function'){
                throw 'fit';
            }
            if(typeof n === 'number'){
                return n;
            }else{
                throw n;
            }
        }
        it('should work',function(){
            return promise.map([1,3,5,7,9],loveNumbers).should.become([1,3,5,7,9]);
        });
        it('should work with promises',function(){
            return promise.map([promise.resolve(1),promise.resolve(3),promise.resolve(5),promise.resolve(7),promise.resolve(9)],loveNumbers).should.become([1,3,5,7,9]);
        });
        it('should work with errors',function(){
            return promise.map([1,3,5,7,9,'boo'],loveNumbers).should.be.rejected.and.become('boo');
        });
        it('should work on an empty array',function(){
            return promise.map([],loveNumbers).should.become([]);
        });
    });
    describe('with simple promises',function(){
        function loveNumbers(n){
            if(n.then && typeof n.then === 'function'){
                throw 'fit';
            }
            if(typeof n === 'number'){
                return promise.resolve(n);
            }else{
                return promise.reject(n);
            }
        }
        it('should work',function(){
            return promise.map([1,3,5,7,9],loveNumbers).should.become([1,3,5,7,9]);
        });
        it('should work with promises',function(){
            return promise.map([promise.resolve(1),promise.resolve(3),promise.resolve(5),promise.resolve(7),promise.resolve(9)],loveNumbers).should.become([1,3,5,7,9]);
        });
        it('should work with errors',function(){
            return promise.map([1,3,5,7,9,'boo'],loveNumbers).should.be.rejected.and.become('boo');
        });
    });
    describe('with complex promises',function(){
        function loveNumbers(n){
            if(n.then && typeof n.then === 'function'){
                throw 'fit';
            }
            if(typeof n === 'number'){
                return promise(function(yes,no){
                    setTimeout(function(){
                        yes(n);
                    },10-n);
                });
            }else{
                return promise(function(yes,no){
                    setTimeout(function(){
                        no(n);
                    },10*Math.random());
                });
            }
        }
        it('should work',function(){
            return promise.map([1,3,5,7,9],loveNumbers).should.become([1,3,5,7,9]);
        });
        it('should work with promises',function(){
            return promise.map([promise.resolve(1),promise.resolve(3),promise.resolve(5),promise.resolve(7),promise.resolve(9)],loveNumbers).should.become([1,3,5,7,9]);
        });
        it('should work with errors',function(){
            return promise.map([1,3,5,7,9,'boo'],loveNumbers).should.be.rejected.and.become('boo');
        });
    });
});
describe("race", function() {
    /*not planning on testing this much
      unless I can figure out a better
      way to test something that is
      inherently a race condition*/
    it('should work',function(){
        return promise.race([
            promise(function(yes,no){
                setTimeout(function(){
                    yes('no');
                },20);
            }),
            promise(function(yes,no){
                setTimeout(function(){
                    yes('yes');
                },10);
            }),
            promise(function(yes,no){
                setTimeout(function(){
                    yes('seriously no');
                },30);
            })
        ]).should.become('yes');
    });
    it('should work with an error',function(){
        return promise.race([
            promise(function(yes,no){
                setTimeout(function(){
                    yes('no');
                },20);
            }),
            promise(function(yes,no){
                setTimeout(function(){
                    no('no');
                },10);
            }),
            promise(function(yes,no){
                setTimeout(function(){
                    yes('seriously no');
                },30);
            })
        ]).should.be.rejected.and.become('no');
    });
});
describe("cast",function(){
    it('should work with a value',function(){
        return promise.cast(1).should.become(1);
    });
    it('should work with a promise',function(){
        return promise.cast(promise.resolve(1)).should.become(1);
    });
});
describe("use",function(){
    function loveNumbers(n){
        if(n.then && typeof n.then === 'function'){
            throw 'fit';
        }
        if(typeof n === 'number'){
            return n*2;
        }else{
            throw n;
        }
    }
    it('should work with a value',function(){
        return promise.use(1,loveNumbers).should.equal(2);
    });
    it('should work with a promise',function(){
        return promise.use(promise.resolve(1),loveNumbers).should.become(2);
    });
    it('should work with an error',function(){
        return promise.use(promise.resolve('boo'),loveNumbers).should.be.rejected.and.become('boo');
    });
});
describe("denodify",function(){
    describe('singleValue',function(){
        var nodeLike = promise.denodify(function(a,cb){
            if(typeof a === 'number'){
                cb(null,a);
            }else if(typeof a === 'string'){
                cb(a);
            }
        });
        it('should work',function(){
            return nodeLike(5).should.become(5);
        });
        it('should throw',function(){
            return nodeLike('boo').should.be.rejected.and.become('boo');
        });
    });
    describe('multivalue',function(){
        var nodeLike = promise.denodify(function(a,b,cb){
            if(typeof a === 'number'&&typeof b === 'number'){
                cb(null,a+b);
            }else if(typeof a === 'number'&&typeof b === 'function'){
                b(null,a);
            }else if(typeof a === 'string'){
                if(typeof b === 'function'){
                    b(a);
                }else{
                    cb(a);
                }
            }else if(typeof b === 'string'){
                cb(b);
            }else if(typeof a === 'function'){
                a('need a value');
            }
        });
        it('should work',function(){
            return nodeLike(5).should.become(5);
        });
        it('should work with 2 numbers',function(){
            return nodeLike(2,3).should.become(5);
        });
        it('should work with a number and a string',function(){
            return nodeLike(2,'boo').should.be.rejected.and.become('boo');
        });
        it('should work with a number and a string',function(){
            return nodeLike('boo').should.be.rejected.and.become('boo');
        });
        it('should work with a no arguments',function(){
            return nodeLike().should.be.rejected.and.become('need a value');
        });
    });
});
describe("apply",function(){
    it('should work without a value',function(){
        return promise.apply(function(){return promise.cast(1)}).should.become(1);
    });
    it('should work with a promise',function(){
        return promise.apply(function(a){
            return a+a;
        },promise.cast(2)).should.become(4);
    });
    it('should work with a value',function(){
        return promise.apply(function(a){
            return a+a;
        },2).should.become(4);
    });
    it('should work with several values',function(){
        return promise.apply(function(a,b,c){
            return a+b+c;
        },'a','b','c').should.become('abc');
    });
    it('should work with several promises',function(){
        return promise.apply(function(a,b,c){
            return a+b+c;
        },promise.cast('a'),promise.cast('b'),promise.cast('c')).should.become('abc');
    });
    it('should work with a mixture',function(){
        return promise.apply(function(a,b,c){
            return a+b+c;
        },promise.cast('a'),'b',promise.cast('c')).should.become('abc');
    });
});
describe("lfold", function() {
    it('should work',function(){
        return promise.lfold([1,2,3,4,5],function(a,b){
            return promise.resolve(a.concat(b));
        },[]).should.become([1,2,3,4,5]);
    });
    it('should work async',function(){
        return promise.lfold([
            promise(function(yes){
                setTimeout(function(){
                    yes(1);
                },50);
            }),
            promise(function(yes){
                setTimeout(function(){
                    yes(2);
                },20);
            }),
            promise(function(yes){
                setTimeout(function(){
                    yes(3);
                },40);
            }),
            promise(function(yes){
                setTimeout(function(){
                    yes(4);
                },10);
            }),
            promise(function(yes){
                setTimeout(function(){
                    yes(5);
                },30);
            })
        ],function(a,b){
            return promise.resolve(a.concat(b));
        },[]).should.become([1,2,3,4,5]);
    });
    it('should work without an accumulator',function(){
        return promise.lfold([[],1,2,3,4,5],function(a,b){
            return a.concat(b);
        }).should.become([1,2,3,4,5]);
    });
    it('should work with a mixture of things which returns a promise',function(){
        return promise.lfold([2,promise.resolve(5),3],function(a,b){
            return promise.resolve(a*b);
        }).should.become(30);
    });
    it('should work with a mixture of things which return a value',function(){
        return promise.lfold([2,promise.resolve(5),3],function(a,b){
            return a*b;
        }).should.become(30);
    });
});
describe("rfold", function() {
    it('should work',function(){
        return promise.rfold([1,2,3,4,5],function(a,b){
            return promise.resolve(a.concat(b));
        },[]).should.become([5,4,3,2,1]);
    });
    it('should work async',function(){
        return promise.rfold([
            promise(function(yes){
                setTimeout(function(){
                    yes(1);
                },50);
            }),
            promise(function(yes){
                setTimeout(function(){
                    yes(2);
                },20);
            }),
            promise(function(yes){
                setTimeout(function(){
                    yes(3);
                },40);
            }),
            promise(function(yes){
                setTimeout(function(){
                    yes(4);
                },10);
            }),
            promise(function(yes){
                setTimeout(function(){
                    yes(5);
                },30);
            })
        ],function(a,b){
            return promise.resolve(a.concat(b));
        },[]).should.become([5,4,3,2,1]);
    });
    it('should work without an accumulator',function(){
        return promise.rfold([1,2,3,4,5,[]],function(a,b){
            return a.concat(b);
        }).should.become([5,4,3,2,1]);
    });
    it('should work with a mixture of things which returns a promise',function(){
        return promise.rfold([2,promise.resolve(5),3],function(a,b){
            return promise.resolve(a*b);
        }).should.become(30);
    });
    it('should work with a mixture of things which return a value',function(){
        return promise.rfold([2,promise.resolve(5),3],function(a,b){
            return a*b;
        }).should.become(30);
    });
});
describe("fold", function() {
    it('should work with a mixture of things which returns a promise',function(){
        return promise.fold([2,promise.resolve(5),3],function(a,b){
            return promise.resolve(a*b);
        }).should.become(30);
    });
    it('should work with a mixture of things which return a value',function(){
        return promise.fold([2,promise.resolve(5),3],function(a,b){
            return a*b;
        }).should.become(30);
    });
    it('should work',function(){
        return promise.fold([
            promise(function(yes){
                setTimeout(function(){
                    yes(5);
                },50);
            }),
            promise(function(yes){
                setTimeout(function(){
                    yes(2);
                },20);
            }),
            promise(function(yes){
                setTimeout(function(){
                    yes(4);
                },40);
            }),
            promise(function(yes){
                setTimeout(function(){
                    yes(1);
                },10);
            }),
            promise(function(yes){
                setTimeout(function(){
                    yes(3);
                },30);
            })
        ],function(a,b){
            return promise.resolve(a.concat(b));
        },[]).should.become([1,2,3,4,5]);
    });
    it('should work without an accumulator',function(){
        return promise.fold([[],
            promise(function(yes){
                setTimeout(function(){
                    yes(5);
                },50);
            }),
            promise(function(yes){
                setTimeout(function(){
                    yes(2);
                },20);
            }),
            promise(function(yes){
                setTimeout(function(){
                    yes(4);
                },40);
            }),
            promise(function(yes){
                setTimeout(function(){
                    yes(1);
                },10);
            }),
            promise(function(yes){
                setTimeout(function(){
                    yes(3);
                },30);
            })],function(a,b){
            return promise.resolve(a.concat(b));
        }).should.become([1,2,3,4,5]);
    });
});
describe("zip", function() {
    describe('should work on values',function(){
        it('with one array',function(){
            return promise.zip([1,2,3,4,5]).should.become([[1],[2],[3],[4],[5]]);
        });
        it('with two arrays',function(){
            return promise.zip([1,2,3,4,5],['a','b','c','d','e']).should.become([[1,'a'],[2,'b'],[3,'c'],[4,'d'],[5,'e']]);
        });
        it('with three arrays',function(){
            return promise.zip([1,2,3,4,5],['a','b','c','d','e'],[10,20,30,40,50]).should.become([[1,'a',10],[2,'b',20],[3,'c',30],[4,'d',40],[5,'e',50]]);
        });
    });
    describe('should work on promises',function(){
        it('with one array',function(){
            return promise.zip([1,2,3,4,5].map(promise.resolve)).should.become([[1],[2],[3],[4],[5]]);
        });
        it('with two arrays',function(){
            return promise.zip([1,2,3,4,5].map(promise.resolve),['a','b','c','d','e'].map(promise.resolve)).should.become([[1,'a'],[2,'b'],[3,'c'],[4,'d'],[5,'e']]);
        });
        it('with three arrays',function(){
            return promise.zip([1,2,3,4,5].map(promise.resolve),['a','b','c','d','e'].map(promise.resolve),[10,20,30,40,50].map(promise.resolve)).should.become([[1,'a',10],[2,'b',20],[3,'c',30],[4,'d',40],[5,'e',50]]);
        });
    });
    describe('should work on a mixuture of promises and values',function(){
        it('with one array',function(){
            return promise.zip([promise.resolve(1),2,promise.resolve(3),4,5]).should.become([[1],[2],[3],[4],[5]]);
        });
        it('with two arrays',function(){
            return promise.zip([1,2,3,4,5].map(promise.resolve),['a','b','c','d','e']).should.become([[1,'a'],[2,'b'],[3,'c'],[4,'d'],[5,'e']]);
        });
        it('with three arrays',function(){
            return promise.zip([1,2,3,4,5],['a','b','c','d','e'].map(promise.resolve),[10,20,promise.resolve(30),40,50]).should.become([[1,'a',10],[2,'b',20],[3,'c',30],[4,'d',40],[5,'e',50]]);
        });
    });
    describe('should work on uneven sized arrays',function(){
        it('with two arrays one shorter',function(){
            return promise.zip([1,2,3,4,5].map(promise.resolve),['a','b','c','d']).should.become([[1,'a'],[2,'b'],[3,'c'],[4,'d']]);
        });
        it('with three arrays all different sizes',function(){
            return promise.zip([1,2,3,4,5,6],['a','b','c'].map(promise.resolve),[10,20,promise.resolve(30),40,50]).should.become([[1,'a',10],[2,'b',20],[3,'c',30]]);
        });
    });
});
describe("zipwith", function() {
    describe('should work on values',function(){
        it('with one array',function(){
            return promise.zipwith(function(a){return a+a},[1,2,3,4,5]).should.become([2,4,6,8,10]);
        });
        it('with two arrays',function(){
            return promise.zipwith(function(a,b){
                return a+b;
            },[1,2,3,4,5],['a','b','c','d','e']).should.become(['1a','2b','3c','4d','5e']);
        });
        it('with three arrays',function(){
            return promise.zipwith(function(a,b,c){
                return a+b+c;
            },[1,2,3,4,5],['a','b','c','d','e'],[10,20,30,40,50]).should.become(['1a10','2b20','3c30','4d40','5e50']);
        });
    });
    describe('should work on promises',function(){
        it('with one array',function(){
            return promise.zipwith(function(a){return a+a},[1,2,3,4,5].map(promise.resolve)).should.become([2,4,6,8,10]);
        });
        it('with two arrays',function(){
            return promise.zipwith(function(a,b){
                return a+b;
            },[1,2,3,4,5].map(promise.resolve),['a','b','c','d','e'].map(promise.resolve)).should.become(['1a','2b','3c','4d','5e']);
        });
        it('with three arrays',function(){
            return promise.zipwith(function(a,b,c){
                return a+b+c;
            },[1,2,3,4,5].map(promise.resolve),['a','b','c','d','e'].map(promise.resolve),[10,20,30,40,50].map(promise.resolve)).should.become(['1a10','2b20','3c30','4d40','5e50']);
        });
    });
    describe('should work on a mixuture of promises and values',function(){
        it('with one array',function(){
            return promise.zipwith(function(a){return a+a},[promise.resolve(1),2,promise.resolve(3),4,5]).should.become([2,4,6,8,10]);
        });
        it('with two arrays',function(){
            return promise.zipwith(function(a,b){
                return a+b;
            },[1,2,3,4,5].map(promise.resolve),['a','b','c','d','e']).should.become(['1a','2b','3c','4d','5e']);
        });
        it('with three arrays',function(){
            return promise.zipwith(function(a,b,c){
                return a+b+c;
            },[1,2,3,4,5],['a','b','c','d','e'].map(promise.resolve),[10,20,promise.resolve(30),40,50]).should.become(['1a10','2b20','3c30','4d40','5e50']);
        });
    });
    describe('should work on uneven sized arrays',function(){
        it('with two arrays one shorter',function(){
            return promise.zipwith(function(a,b){
                return a+b;
            },[1,2,3,4,5].map(promise.resolve),['a','b','c','d']).should.become(['1a','2b','3c','4d']);
        });
        it('with three arrays all different sizes',function(){
            return promise.zipwith(function(a,b,c){
                return a+b+c;
            },[1,2,3,4,5,6],['a','b','c'].map(promise.resolve),[10,20,promise.resolve(30),40,50]).should.become(['1a10','2b20','3c30']);
        });
    });
});
describe("filter", function() {
  it("should work", function() {
    return promise.filter([1,2,3,4],function(v){return v%2}).should.become([1,3]);
  });
  it("should work if all are false", function() {
    return promise.filter([1,2,3,4],function(v){return false;}).should.become([]);
  });
  it("should work async", function() {
    return promise.filter([promise.resolve(1),promise.resolve(2),3,4],function(v){return v%2}).should.become([1,3]);
  });
  it("should work async if all are false", function() {
    return promise.filter([1,promise.resolve(2),promise.resolve(3),4],function(v){return false;}).should.become([]);
  });
});
describe("every", function() {
    describe('basic', function() {
        it("should become true", function() {
            return promise.every([1, 2, 3, 4], function(v) {
                return v < 5
            }).should.become(true);
        });
        it("should become false 1", function() {
            return promise.every([1, 2, 3, 4], function(v) {
                return v > 1;
            }).should.become(false);
        });
        it("should become false 2", function() {
            return promise.every([1, 2, 3, 4], function(v) {
                return v < 4;
            }).should.become(false);
        });
    });
    describe('async', function() {
        it("should become true", function() {
            return promise.every([promise.resolve(1), promise.resolve(2), 3, 4], function(v) {
                return v < 5
            }).should.become(true);
        });
        it("should become false 1", function() {
            return promise.every([promise.resolve(1), promise.resolve(2), 3, 4], function(v) {
                return v > 1;
            }).should.become(false);
        });
        it("should become false 2", function() {
            return promise.every([promise.resolve(1), promise.resolve(2), 3, 4], function(v) {
                return v < 4;
            }).should.become(false);
        });
    });
    describe('no func', function() {
        it('should work',function(){
            return promise.every([promise.resolve(1), promise.resolve(2), 3, 4]).should.become(true); 
        });
        it('should fail 1',function(){
            return promise.every([promise.resolve(1), promise.resolve(2), 0, 4]).should.become(false); 
        });
        it('should fail 2',function(){
            return promise.every([promise.resolve(1), promise.resolve(0), 3, 4]).should.become(false); 
        });
    });
    describe('lazy',function(){
        it("should be lazy", function() {
            return promise.every([promise(function(yes,no){
                setTimeout(function(){
                    no('nope');
                },50);
            }),promise(function(yes,no){
                setTimeout(function(){
                    yes(2);
                },10);
            }),3,5],function(v){return v%2;}).should.become(false);
          });
          it("should fail on a failure", function() {
            return promise.every([promise(function(yes,no){
                setTimeout(function(){
                    no('nope');
                },10);
            }),promise(function(yes,no){
                setTimeout(function(){
                    yes(2);
                },50);
            }),3,5],function(v){return v%2;}).should.be.be.rejected.and.become('nope');
          });
    });
});
describe("any", function() {
  it("should become true", function() {
    return promise.any([1,2,3,4],function(v){return !(v%4);}).should.become(true);
  });
  it("should become false", function() {
    return promise.any([1,2,3,4],function(v){return !(v%5);}).should.become(false);
  });
  it("should become true async", function() {
    return promise.any([promise.resolve(1),promise.resolve(2),3,4],function(v){return !(v%4)}).should.become(true);
  });
  it("should become false async", function() {
    return promise.any([promise.resolve(1),promise.resolve(2),3,4],function(v){return !(v%5);}).should.become(false);
  });
  it("should be lazy", function() {
    return promise.any([promise(function(yes,no){
        setTimeout(function(){
            no('nope');
        },50);
    }),promise(function(yes,no){
        setTimeout(function(){
            yes(2);
        },10);
    }),3,4],function(v){return v===2;}).should.become(true);
  });
  it("should fail on a failure", function() {
    return promise.any([promise(function(yes,no){
        setTimeout(function(){
            no('nope');
        },10);
    }),promise(function(yes,no){
        setTimeout(function(){
            yes(2);
        },50);
    }),3,4],function(v){return v===2;}).should.be.rejected.and.become('nope');
  });
  it('should work without a function',function(){
      return promise.any([0,false,3,null]).should.become(true);
  });
  it('should still give a false without a function',function(){
      return promise.any([0,false,null]).should.become(false);
  });
  it('should work without a function async',function(){
      return promise.any([promise.resolve(0),promise.resolve(false),3,null]).should.become(true);
  });
  it('should still give a false without a function async',function(){
      return promise.any([promise.resolve(0),promise.resolve(false),null]).should.become(false);
  });
});
