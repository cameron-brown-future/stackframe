
function _isNumber(n: any): boolean {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

function _capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.substring(1);
}

function _getter(p: string): Function {
    return function(this: StackFrame) {
        return this[p];
    };
}

var booleanProps: string[] = ['isConstructor', 'isEval', 'isNative', 'isToplevel'];
var numericProps: string[] = ['columnNumber', 'lineNumber'];
var stringProps:  string[] = ['fileName', 'functionName', 'source'];
var arrayProps:   string[] = ['args'];

var props: string[] = booleanProps.concat(numericProps, stringProps, arrayProps);

function StackFrame(this: StackFrame, obj?: object) {
    if (obj instanceof Object) {
        for (var i = 0; i < props.length; i++) {
            if (obj.hasOwnProperty(props[i]) && obj[props[i]] !== undefined) {
                this['set' + _capitalize(props[i])](obj[props[i]]);
            }
        }
    }
}

StackFrame.prototype = {
    getArgs: function() {
        return this.args;
    },
    setArgs: function(v) {
        if (Object.prototype.toString.call(v) !== '[object Array]') {
            throw new TypeError('Args must be an Array');
        }
        this.args = v;
    },

    getEvalOrigin: function() {
        return this.evalOrigin;
    },
    setEvalOrigin: function(v) {
        if (v instanceof StackFrame) {
            this.evalOrigin = v;
        } else if (v instanceof Object) {
            this.evalOrigin = new StackFrame(v);
        } else {
            throw new TypeError('Eval Origin must be an Object or StackFrame');
        }
    },

    toString: function() {
        var fileName = this.getFileName() || '';
        var lineNumber = this.getLineNumber() || '';
        var columnNumber = this.getColumnNumber() || '';
        var functionName = this.getFunctionName() || '';
        if (this.getIsEval()) {
            if (fileName) {
                return '[eval] (' + fileName + ':' + lineNumber + ':' + columnNumber + ')';
            }
            return '[eval]:' + lineNumber + ':' + columnNumber;
        }
        if (functionName) {
            return functionName + ' (' + fileName + ':' + lineNumber + ':' + columnNumber + ')';
        }
        return fileName + ':' + lineNumber + ':' + columnNumber;
    }
};

StackFrame.fromString = function StackFrame$$fromString(str) {
    var argsStartIndex = str.indexOf('(');
    var argsEndIndex = str.lastIndexOf(')');

    var functionName = str.substring(0, argsStartIndex);
    var args = str.substring(argsStartIndex + 1, argsEndIndex).split(',');
    var locationString = str.substring(argsEndIndex + 1);

    var fileName
    var lineNumber
    var columnNumber
    if (locationString.indexOf('@') === 0) {
        var parts = /@(.+?)(?::(\d+))?(?::(\d+))?$/.exec(locationString);
        if (parts) {
          fileName = parts[1];
          lineNumber = parts[2];
          columnNumber = parts[3];
        }
    }

    return new StackFrame({
        functionName: functionName,
        args: args || undefined,
        fileName: fileName,
        lineNumber: lineNumber || undefined,
        columnNumber: columnNumber || undefined
    });
};

for (var i = 0; i < booleanProps.length; i++) {
    StackFrame.prototype['get' + _capitalize(booleanProps[i])] = _getter(booleanProps[i]);
    StackFrame.prototype['set' + _capitalize(booleanProps[i])] = (function(p) {
        return function(this: StackFrame, v) {
            this[p] = Boolean(v);
        };
    })(booleanProps[i]);
}

for (var j = 0; j < numericProps.length; j++) {
    StackFrame.prototype['get' + _capitalize(numericProps[j])] = _getter(numericProps[j]);
    StackFrame.prototype['set' + _capitalize(numericProps[j])] = (function(p) {
        return function(this: StackFrame, v) {
            if (!_isNumber(v)) {
                throw new TypeError(p + ' must be a Number');
            }
            this[p] = Number(v);
        };
    })(numericProps[j]);
}

for (var k = 0; k < stringProps.length; k++) {
    StackFrame.prototype['get' + _capitalize(stringProps[k])] = _getter(stringProps[k]);
    StackFrame.prototype['set' + _capitalize(stringProps[k])] = (function(p) {
        return function(this: StackFrame, v) {
            this[p] = String(v);
        };
    })(stringProps[k]);
}

export default StackFrame;
