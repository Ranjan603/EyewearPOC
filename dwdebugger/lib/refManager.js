'use strict';

function RefManager() {
    this.references = {
    };
    this.currentReferences = {
    };
    this.lastIndexUsed = 0;
    this.lastUsedScopeIndex = 0;
    this.initialize();
}

RefManager.prototype = {
    initialize: function () {
        this.undefinedRef = this.addRef({
            type: 'undefined',
            text: 'undefined'
        }, 'variables');
        this.nullRef = this.addRef({
            type: 'null',
            text: 'null'
        }, 'variables');
    },

    findRefByHandle: function (handle) {
        return this.references[handle] || this.currentReferences[handle];
    },

    findRef: function (value, type) {
        var result = null;
        switch (type) {
            case 'variables':
                var searchString = typeof value === 'object' ? value.text : value;
                result = this.currentReferences.variables.find(function (item) {
                    return item.text === searchString;
                });
                if (!result) {
                    result = this.references.variables.find(function (item) {
                        return item.text === searchString;
                    });
                }
                break;
            case 'scope':
                result = null;
                break;
            case 'functions':
                break;
            default:
                result = null;
                break;
        }
        if (!result) {
            result = this.references[type].find(function (item) {
                return item.name === value;
            });
        }
        return result;
    },

    findOrAdd: function (ref, type) {
        var result = this.findRef(type, ref);
        if (!result) {
            return this.addRef(ref, type);
        }
        return result.handle;
    },

    addRef: function (ref, type) {
        var newIndex = type === 'scopes' ? --this.lastUsedScopeIndex : this.lastIndexUsed++;
        ref.handle = newIndex;
        this.currentReferences[newIndex] = ref;
        return newIndex;
    },

    addHandler: function (ref, type) {
        var newIndex = type === 'scopes' ? --this.lastUsedScopeIndex : this.lastIndexUsed++;
        ref.handle = newIndex;
        this.references[newIndex] = ref;
        return ref;
    },

    addRefForVar: function (item) {
        var me = this;
        function setupRefsForString(string) {
            return me.addRef({
                type: 'string',
                value: string,
                length: string.length,
                text: string
            }, 'variables')
        }

        function setupRefsForNumber(number) {
            return me.addRef({
                type: 'number',
                value: number,
                text: number.toString()
            }, 'variables')
        }

        function setupRefsForBool(bool) {
            return me.addRef({
                type: 'boolean',
                value: bool,
                text: bool.toString()
            }, 'variables')
        }

        function setupRefsForArray(array) {
            var properties = [];
            properties.push({
                name: 'length',
                propertyType: 3,
                ref: setupRefsForNumber(array.length)
            });
            array.forEach(function (item, index) {
                properties.push({
                    name: index.toString(),
                    ref: setupRefsForVariable(item)
                });
            });

            return me.addRef({
                type: 'object',
                className: 'Array',
                constructorFunction: {
                    ref: me.undefinedRef
                },
                protoObject: {
                    ref: me.undefinedRef
                },
                prototypeObject: {
                    ref: me.undefinedRef
                },
                properties: properties
            }, 'variables');
        }

        function setupRefsForObject(object) {
            var properties = Object.keys(object).map(function (key) {
                return {
                    name: key,
                    propertyType: 1,
                    ref: setupRefsForVariable(object[key])
                };
            });

            return me.addRef({
                type: 'object',
                className: 'Object',
                constructorFunction: {
                    ref: me.undefinedRef
                },
                protoObject: {
                    ref: me.undefinedRef
                },
                prototypeObject: {
                    ref: me.undefinedRef
                },
                properties: properties
            }, 'variables');
        }

        function setupRefsForVariable(variable) {
            switch (typeof variable) {
                case 'string':
                    return setupRefsForString(variable);
                case 'number':
                    return setupRefsForNumber(variable);
                case 'boolean':
                    return setupRefsForBool(variable);
                case 'object':
                    if (variable === null) {
                        return me.nullRef;
                    }
                    if (Array.isArray(variable)) {
                        return setupRefsForArray(variable);
                    }
                    return setupRefsForObject(variable);
                default:
                    return null;
            }
        }
        return setupRefsForVariable(item);
    },

    resetRefTable: function () {
        Object.keys(this.currentReferences).forEach(function (ref) {
            this.references[ref] = this.currentReferences[ref];
        }, this);
        this.currentReferences = {};
    },

    getRefs: function () {
        var output = Object.keys(this.currentReferences).map(function (key) {
            return this.currentReferences[key];
        }, this);
        output.push(this.references[this.nullRef]);
        output.push(this.references[this.undefinedRef]);
        return output;
    },

    getAllRefsForHandle: function (handle) {
        var mainRef = handle;
        var refList = [];
        Object.keys(mainRef).forEach(function (item) {
            if (item === 'ref') {
                refList.push(mainRef[item]);
            } else if (typeof mainRef[item] === 'object' && !Array.isArray(mainRef[item])) {
                refList = refList.concat(this.getAllRefsForHandle(mainRef[item]));
            } else if (Array.isArray(mainRef[item])) {
                mainRef[item].forEach(function (key) {
                    refList = refList.concat(this.getAllRefsForHandle(key));
                }, this);
            }
        }, this);
        return refList;
    }
};

module.exports = RefManager;
