/**
 * Safe Mathematical Expression Lexer, Parser & Evaluator
 * Evaluates functions f(x) with strict numerical validation and safety limits.
 */

export interface Token {
  type: "NUMBER" | "VAR" | "OP" | "FUNC" | "LPAREN" | "RPAREN" | "COMMA";
  value: string;
}

export type ASTNode =
  | { type: "number"; value: number }
  | { type: "variable"; name: string }
  | { type: "unary"; op: string; argument: ASTNode }
  | { type: "binary"; op: string; left: ASTNode; right: ASTNode }
  | { type: "call"; func: string; args: ASTNode[] };

export class MathEvaluator {
  private ast: ASTNode | null = null;
  public rawExpr: string = "";

  constructor(expression?: string) {
    if (expression) {
      this.compile(expression);
    }
  }

  public compile(expression: string): void {
    this.rawExpr = expression;
    const tokens = this.tokenize(expression);
    const parser = new ASTParser(tokens);
    this.ast = parser.parse();
  }

  public evaluate(x: number): number {
    if (!this.ast) {
      throw new Error("No expression compiled.");
    }
    return this.evaluateNode(this.ast, x);
  }

  public evaluateSafe(x: number): number | null {
    try {
      const val = this.evaluate(x);
      if (typeof val !== "number" || isNaN(val) || !isFinite(val)) {
        return null;
      }
      return val;
    } catch {
      return null;
    }
  }

  public numericalDerivative(x: number, h: number = 1e-5): number | null {
    const fPlus = this.evaluateSafe(x + h);
    const fMinus = this.evaluateSafe(x - h);
    if (fPlus === null || fMinus === null) return null;
    return (fPlus - fMinus) / (2 * h);
  }

  public numericalSecondDerivative(x: number, h: number = 1e-4): number | null {
    const fPlus = this.evaluateSafe(x + h);
    const fCenter = this.evaluateSafe(x);
    const fMinus = this.evaluateSafe(x - h);
    if (fPlus === null || fCenter === null || fMinus === null) return null;
    return (fPlus - 2 * fCenter + fMinus) / (h * h);
  }

  private evaluateNode(node: ASTNode, x: number): number {
    switch (node.type) {
      case "number":
        return node.value;
      case "variable":
        return x;
      case "unary": {
        const val = this.evaluateNode(node.argument, x);
        if (node.op === "-") return -val;
        if (node.op === "+") return +val;
        throw new Error(`Unknown unary op: ${node.op}`);
      }
      case "binary": {
        const left = this.evaluateNode(node.left, x);
        const right = this.evaluateNode(node.right, x);
        switch (node.op) {
          case "+":
            return left + right;
          case "-":
            return left - right;
          case "*":
            return left * right;
          case "/": {
            if (Math.abs(right) < 1e-14) {
              return right >= 0 ? Infinity : -Infinity;
            }
            return left / right;
          }
          case "^": {
            // Handle fractional roots of negative numbers safely or pow
            if (left < 0 && Math.abs(Math.round(right) - right) > 1e-6) {
              // Fractional power of negative number is complex (not real)
              return NaN;
            }
            return Math.pow(left, right);
          }
          default:
            throw new Error(`Unknown binary op: ${node.op}`);
        }
      }
      case "call": {
        const evaluatedArgs = node.args.map((arg) => this.evaluateNode(arg, x));
        const arg = evaluatedArgs[0];
        switch (node.func.toLowerCase()) {
          case "sqrt":
            if (arg < 0) return NaN;
            return Math.sqrt(arg);
          case "abs":
            return Math.abs(arg);
          case "ln":
          case "log":
            if (arg <= 0) return NaN;
            return Math.log(arg);
          case "log10":
            if (arg <= 0) return NaN;
            return Math.log10(arg);
          case "log2":
            if (arg <= 0) return NaN;
            return Math.log2(arg);
          case "exp":
            return Math.exp(arg);
          case "sin":
            return Math.sin(arg);
          case "cos":
            return Math.cos(arg);
          case "tan": {
            // Check singularity cos(x) ≈ 0
            if (Math.abs(Math.cos(arg)) < 1e-12) return NaN;
            return Math.tan(arg);
          }
          default:
            throw new Error(`Unknown function: ${node.func}`);
        }
      }
    }
  }

  private tokenize(raw: string): Token[] {
    const cleaned = raw.trim();
    const tokens: Token[] = [];
    let i = 0;

    while (i < cleaned.length) {
      const char = cleaned[i];

      // Whitespace
      if (/\s/.test(char)) {
        i++;
        continue;
      }

      // Numbers (e.g. 12, 3.14, .5)
      if (/[0-9]/.test(char) || (char === "." && i + 1 < cleaned.length && /[0-9]/.test(cleaned[i + 1]))) {
        let numStr = "";
        while (i < cleaned.length && (/[0-9]/.test(cleaned[i]) || cleaned[i] === ".")) {
          numStr += cleaned[i];
          i++;
        }
        tokens.push({ type: "NUMBER", value: numStr });
        continue;
      }

      // Identifier (variable 'x', constants 'e', 'pi', or functions 'sqrt', 'sin', 'cos', 'ln', 'abs')
      if (/[a-zA-Z_]/.test(char)) {
        let ident = "";
        while (i < cleaned.length && /[a-zA-Z0-9_]/.test(cleaned[i])) {
          ident += cleaned[i];
          i++;
        }

        const lower = ident.toLowerCase();
        if (lower === "x") {
          tokens.push({ type: "VAR", value: "x" });
        } else if (lower === "pi") {
          tokens.push({ type: "NUMBER", value: Math.PI.toString() });
        } else if (lower === "e" && tokens.length > 0 && tokens[tokens.length - 1].type === "NUMBER") {
          // Scientific notation check or e constant
          tokens.push({ type: "NUMBER", value: Math.E.toString() });
        } else if (lower === "e") {
          tokens.push({ type: "NUMBER", value: Math.E.toString() });
        } else {
          tokens.push({ type: "FUNC", value: lower });
        }
        continue;
      }

      // Parentheses & Brackets
      if (char === "(" || char === "[") {
        tokens.push({ type: "LPAREN", value: "(" });
        i++;
        continue;
      }
      if (char === ")" || char === "]") {
        tokens.push({ type: "RPAREN", value: ")" });
        i++;
        continue;
      }

      // Absolute value vertical bars |x|
      if (char === "|") {
        // Handled in pre-processing or transformed
        tokens.push({ type: "OP", value: "|" });
        i++;
        continue;
      }

      // Operators
      if (["+", "-", "*", "/", "^"].includes(char)) {
        tokens.push({ type: "OP", value: char });
        i++;
        continue;
      }

      if (char === ",") {
        tokens.push({ type: "COMMA", value: "," });
        i++;
        continue;
      }

      // Unknown character, skip
      i++;
    }

    return this.insertImplicitMultiplication(tokens);
  }

  private insertImplicitMultiplication(tokens: Token[]): Token[] {
    const result: Token[] = [];

    for (let i = 0; i < tokens.length; i++) {
      const current = tokens[i];
      result.push(current);

      if (i + 1 < tokens.length) {
        const next = tokens[i + 1];

        // NUMBER followed by VAR -> 2x -> 2*x
        // NUMBER followed by FUNC -> 2sin(x) -> 2*sin(x)
        // NUMBER followed by LPAREN -> 2(x+1) -> 2*(x+1)
        // VAR followed by LPAREN -> x(x+1) -> x*(x+1)
        // RPAREN followed by LPAREN -> (x+1)(x-1) -> (x+1)*(x-1)
        // RPAREN followed by VAR -> (x+1)x -> (x+1)*x
        // VAR followed by VAR -> x y -> x*y
        const needMul =
          (current.type === "NUMBER" && (next.type === "VAR" || next.type === "FUNC" || next.type === "LPAREN")) ||
          (current.type === "VAR" && (next.type === "LPAREN" || next.type === "FUNC" || next.type === "VAR")) ||
          (current.type === "RPAREN" && (next.type === "LPAREN" || next.type === "VAR" || next.type === "NUMBER" || next.type === "FUNC"));

        if (needMul) {
          result.push({ type: "OP", value: "*" });
        }
      }
    }

    return result;
  }
}

class ASTParser {
  private pos = 0;
  constructor(private tokens: Token[]) {}

  public parse(): ASTNode {
    this.pos = 0;
    const node = this.parseExpression();
    if (this.pos < this.tokens.length) {
      throw new Error(`Unexpected token at end: ${this.tokens[this.pos].value}`);
    }
    return node;
  }

  // Precedence: Addition / Subtraction
  private parseExpression(): ASTNode {
    let left = this.parseTerm();

    while (this.matchOp("+", "-")) {
      const op = this.previous().value;
      const right = this.parseTerm();
      left = { type: "binary", op, left, right };
    }

    return left;
  }

  // Precedence: Multiplication / Division
  private parseTerm(): ASTNode {
    let left = this.parsePower();

    while (this.matchOp("*", "/")) {
      const op = this.previous().value;
      const right = this.parsePower();
      left = { type: "binary", op, left, right };
    }

    return left;
  }

  // Precedence: Exponentiation (Right-associative)
  private parsePower(): ASTNode {
    let left = this.parseUnary();

    if (this.matchOp("^")) {
      const op = this.previous().value;
      const right = this.parsePower(); // right-associative
      left = { type: "binary", op, left, right };
    }

    return left;
  }

  // Precedence: Unary + / -
  private parseUnary(): ASTNode {
    if (this.matchOp("+", "-")) {
      const op = this.previous().value;
      const argument = this.parseUnary();
      return { type: "unary", op, argument };
    }

    return this.parsePrimary();
  }

  // Primary: Number, Variable, Function Call, Parentheses
  private parsePrimary(): ASTNode {
    if (this.match("NUMBER")) {
      return { type: "number", value: parseFloat(this.previous().value) };
    }

    if (this.match("VAR")) {
      return { type: "variable", name: "x" };
    }

    if (this.match("FUNC")) {
      const funcName = this.previous().value;
      if (!this.match("LPAREN")) {
        throw new Error(`Expected '(' after function ${funcName}`);
      }
      const args: ASTNode[] = [];
      if (this.peek().type !== "RPAREN") {
        do {
          args.push(this.parseExpression());
        } while (this.match("COMMA"));
      }
      this.consume("RPAREN", `Expected ')' after ${funcName} arguments`);
      return { type: "call", func: funcName, args };
    }

    if (this.match("LPAREN")) {
      const expr = this.parseExpression();
      this.consume("RPAREN", "Expected ')' after expression");
      return expr;
    }

    throw new Error(`Unexpected token: ${this.peek() ? this.peek().value : "EOF"}`);
  }

  private match(...types: string[]): boolean {
    for (const t of types) {
      if (this.check(t)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private matchOp(...ops: string[]): boolean {
    if (this.check("OP") && ops.includes(this.peek().value)) {
      this.advance();
      return true;
    }
    return false;
  }

  private check(type: string): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.pos++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.pos >= this.tokens.length;
  }

  private peek(): Token {
    return this.tokens[this.pos] || { type: "NUMBER", value: "EOF" };
  }

  private previous(): Token {
    return this.tokens[this.pos - 1];
  }

  private consume(type: string, message: string): Token {
    if (this.check(type)) return this.advance();
    throw new Error(message);
  }
}
