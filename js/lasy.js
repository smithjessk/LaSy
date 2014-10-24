'use strict';

/** Initialization **/

var process = require('process');

// Different types of tokens
var TypeEnum = {
    command: 0,
    left_bracket: 1,
    right_bracket: 2,
    left_paren: 3,
    right_paren: 4,
    carat: 5,
    understore: 6,
    plus: 7,
    minus: 8,
    times: 9,
    num_lit: 10,
    variable: 11
};

/*****************************************************************************/

/** Class Definitions **/

// Class for token
// Used in lexer
function Token(typeEnum, string) {
    this.typeEnum = typeEnum;
    this.string = string;
}

function Expression() {
}

function BinaryExpression(left, operator, right) {
    this.left = left;
    this.operator = operator;
    this.right = right;
}

function PrimaryExpression(left, middle, right) {
    this.left = left;
    this.middle = middle;
    this.right = right;
}

function NumericLiteral(value) {
    this.value = value;
}

function Variable(value) {
    this.value = value;
}

// Class for definite and indefinite integrals
function Integral(isDefinite, upper, lower, integrand, variable) {
    this.isDefinite = isDefinite;
    this.upper = upper;
    this.lower = lower;
    this.integrand = integrand;
    this.variable = variable;
}

/*****************************************************************************/

/** Helper Methods **/

// Checks if a character is a digit (0...9)
function isDigit(character) {
    return (character.charCodeAt(0) >= 48 && character.charCodeAt(0) <= 57);
}

// Checks if a function is an upper- or lowercase letter (a...z or A...Z)
function isLetter(character) {
    return (character.charCodeAt(0) >= 65 && character.charCodeAt(0) <= 90) ||
        (character.charCodeAt(0) >= 97 && character.charCodeAt(0) <= 122);    
}

// Creates a binary tree of expressions and operations
// Called at the ending of each parse expression method
function toBinaryExprTree(exprs, ops) {
    if (exprs.length === 1) {
        return exprs[0];
    } else {
        var nestedExpr = new BinaryExpression(exprs[0], ops[0], exprs[1]);
        for (var i = 1; i < exprs.length - 1; i++) {
            nestedExpr = new BinaryExpression(nestedExpr, 
                ops[i], exprs[i + 1]);
        }
        return nestedExpr;
    }
}

// Creates a binary tree of expressions and operations
// Called at the ending of each parse expression method
function toPrimaryExprTree(exprs, ops) {
    if (ops.length === 1) {
        return ops[0];
    } else {
        var nestedExpr = new PrimaryExpression(ops[0], exprs[0], ops[1]);
        for (var i = 1; i < exprs.length - 1; i++) {
            nestedExpr = new PrimaryExpresion(nestedExpr, 
                exprs[i], ops[i + 1]);
        }
        return nestedExpr;
    }
}

/*****************************************************************************/

/** Main Methods **/

// Note that tokenObj must contain {tokenIndex : tokenIndex}
function parseAddExpr(tokens, tokenObj) {
    var exprs = [], ops = [];

    exprs.push(parseMultExpr(tokens, tokenObj));
    
    while (tokens[tokenObj.tokenIndex] !== undefined && tokens[tokenObj.tokenIndex] !== null && 
        (tokens[tokenObj.tokenIndex].string === '+' || 
        tokens[tokenObj.tokenIndex].string === '-')) {
        ops.push(tokens[tokenObj.tokenIndex++]);
        exprs.push(parseMultExpr(tokens, tokenObj));
    }

    return toBinaryExprTree(exprs, ops)
}

// tokenObj is an object containing one field, tokenIndex, which represents the
// current index being parsed
// Passed as an object because JS passes objects by reference, others by value
function parseMultExpr(tokens, tokenObj) {
    var exprs = [], ops = [];

    exprs.push(parsePrimaryExpr(tokens, tokenObj));

    while (tokens[tokenObj.tokenIndex] !== undefined && tokens[tokenObj.tokenIndex] !== null &&
        (tokens[tokenObj.tokenIndex].string === '*' |
        tokens[tokenObj.tokenIndex].string === '\\mod')) {
        ops.push(tokens[tokenObj.tokenIndex++]);
        exprs.push(parsePrimaryExpr(tokens, tokenObj));
    }

    return toBinaryExprTree(exprs, ops);
}

function parsePrimaryExpr(tokens, tokenObj) {
    var exprs = [], ops = [];

    if (tokens[tokenObj.tokenIndex] !== undefined && tokens[tokenObj.tokenIndex] !== null) { 
        while (tokens[tokenObj.tokenIndex].string === '(') {
            ops.push(tokens[tokenObj.tokenIndex++]);
            exprs.push(parseAddExpr(tokens, tokenObj));            

            while (tokens[tokenObj.tokenIndex].string === ')') {
                ops.push(tokens[tokenObj.tokenIndex++]);
                return toPrimaryExprTree(exprs, ops);
            }
        } 

        if (tokens[tokenObj.tokenIndex].typeEnum === TypeEnum.num_lit) {
            return new NumericLiteral(tokens[tokenObj.tokenIndex++].string);
        } else if (tokens[tokenObj.tokenIndex].typeEnum === TypeEnum.variable) {
            return new Variable(tokens[tokenObj.tokenIndex++].string);
        } 

    }
}

function parseIntegral(tokens, tokenObj) {
    var nextToken = tokens[tokenObj.tokenIndex++];
    var isDefinite = null, upper = null, lower = null, integrand = null, variable = null;

    if (nextToken.typeEnum === TypeEnum.underscore) {
        lower = parseAddExpr(tokens, tokenObj);
        nextToken = tokens[tokenObj.tokenIndex++];

        if (nextToken.typeEnum === TypeEnum.carat) {
            upper = parseAddExpr(tokens, tokenObj);
            nextToken = tokens[tokenObj.tokenIndex++];

        } else {
            console.log('Error: upper bound not found in definite integral');
            return;
        }
    } else if (nextToken.typeEnum === TypeEnum.carat) {
        /** Same process as above **/
    }

    /** Wait until you see the dx **/
    return new Integral(isDefinite, upper, lower, integrand, variable);
}

// Main lexer method 
function lexer(input) {
    var tokens = [];
    var index = 0;

    while (index < input.length) {
        var character = input.charAt(index);
        var begin = index;
        index++;

        switch (character) {

            // Backslash Commands
            case "\\":
                character = input.charAt(index);
                while (isLetter(character)) {
                    index++;
                    character = input.charAt(index);
                }

                tokens.push(new Token(TypeEnum.command, 
                    input.substring(begin, index)));
                break;

            // Left Bracket
            case "{":
                tokens.push(new Token(TypeEnum.left_bracket,
                    input.substring(begin, index)));
                break;

            // Right Bracket
            case "}":
                tokens.push(new Token(TypeEnum.right_bracket,
                    input.substring(begin, index)));
                break;

            // Left parentheses
            case "(":
                tokens.push(new Token(TypeEnum.left_paren,
                    input.substring(begin, index)));
                break;

            // Right parentheses
            case ")":
                tokens.push(new Token(TypeEnum.right_paren,
                    input.substring(begin, index)));
                break;            

            // Carat
            case "^":
                tokens.push(new Token(TypeEnum.carat,
                    input.substring(begin, index)));
                break;

            // Underscore
            case "_":
                tokens.push(new Token(TypeEnum.carat,
                    input.substring(begin, index)));
                break;

            // Addition
            case "+":
                tokens.push(new Token(TypeEnum.plus,
                    input.substring(begin, index)));
                break;

            // Subtraction
            case "-":
                tokens.push(new Token(TypeEnum.minus,
                    input.substring(begin, index)));
                break;

            // Multiplication
            case "*":
                tokens.push(new Token(TypeEnum.times,
                    input.substring(begin, index)));
                break;

            // Default
            default: 
                if (isDigit(character)) {
                    var hasPeriod = false;
                    character = input.charAt(index);

                    while (isDigit(character) || 
                        (character === '.' && !hasPeriod)){
                        index++;
                        character = input.charAt(index);
                    }

                    tokens.push(new Token(TypeEnum.num_lit,
                        input.substring(begin, index)));
                } else if (isLetter(character) ) {
                    tokens.push(new Token(TypeEnum.variable,
                        input.substring(begin, index)));
                } else {
                    console.log('Could not interpret ' + input.substring(begin, index));
                }
                break;
        }
    }

    return tokens;
}

// Main translate method
function translate(input) {
    var tokens = lexer(input);
    console.log('Tokens: \n', tokens, '\n');
    return parseAddExpr(tokens, {tokenIndex: 0});
}

/*****************************************************************************/

// If no command line argument, take a default one (e.g. 'a \\mod b')
var input = (process.argv[2] !== undefined) ? process.argv[2] : 'a \\mod b';
console.log('Binary Tree: \n', translate(input));