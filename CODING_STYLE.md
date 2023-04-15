# Coding Style

> **Note**: Not all the code follows this style... yet.
>
> This is planned to be the new coding style for this project.

This document describes the recommended coding style for this project. If you don't follow this style, we'll
ask you to change your pull request to follow this style.


## Contents

1. [Indentation](#indentation)
2. [Variable declaration](#variable-declaration)
3. [Whitespace](#whitespace)
4. [Ennumerations](#ennumerations)
5. [Braces](#braces)
6. [Switch statements](#switch-statements)
7. [Line breaks](#line-breaks)
8. [Imports](#imports)
9. [Comments](#comments)
10. [HTML](#html)
11. [Final notes](#final-notes)


## Indentation
- Use tabs for indentation.
- Use 4 spaces for indentation in Markdown files.

## Variable declaration
- Use `const` for variables that won't be reassigned.
- Use camelCase for variable names.
- Each variable declaration should be in a separate line.
- Use indicative/useful names. Avoid short names, except:
    - Single character vraiable names for loops and temporary variables whose purpose is obvious (like `e` for error).
- Declare the variable type if it's not obvious.
- Encapsulated variables should start with an underscore or two.
- Use PascalCase for ennumerations, classes, interfaces, functions, etc.

For example:
```ts
// Bad
var dwlbar = 0;
const errtxt = "Error";
let chderr;

// Good
var downloadBarProgress = 0;
const errorText = "Error";
let catchedError: Error;
```

## Whitespace
- Use one space after each keyword
    - Exception: No space between `return` and `;`.
- No space after left parenthesis and before right parenthesis.
- Use single spaces around operators.
- Use one space after each comma.
- Use one space between `{}` if it's empty.

For example:
```ts
// Bad
if(a==b){
	return;
}

// Good
if (a == b) {
	return;
}
```

## Ennumerations
- Write ennumerations in UPPERCASE and use underscores to separate words.
- Ideally, it should be one member per line.

For example:
```ts
// Bad
enum Color { Red, Green, Blue }

// Good
enum Color {
	RED,
	GREEN,
	BLUE
}
```

## Braces
It's simple, the left brace should be in the same line as the statement.

For example:
```ts
// Bad
if (a == b)
{
	return;
}
enum Color
{
	RED,
	GREEN,
	BLUE
}

// Good
if (a == b) {
	return;
}
enum Color {
	RED,
	GREEN,
	BLUE
}
```

Exception: Funcion functions, classes, interfaces and namespaces should have the left brace in a new line.

For example:
```ts
class Debug
{
	function log(message: string, isError: bool): void
	{
		if (isError) {
			console.error(message);
		} else {
			console.log(message);
		}
	}
}
```

Use curly braces even if the statement is only one line.

For example:
```ts
// Bad
if (a == b) return;

// Good

if (a == b) {
	return;
}
```

Put `else` in the same line as the closing brace.

For example:
```ts
// Bad
if (a == b)
	return true;
else
	return false;

// Good
if (a == b) {
	return true;
} else {
	return false;
}
```

## Switch statements
Case labels are on a new column.

For example:
```ts
switch (a) {
	case 1:
		DoSomething();
		break;
	case 2:
		DoSomethingElse();
		// Fallthrough
	default:
		DefaultHandler();
		break;
}
```

Remember to use `break` or `// Fallthrough` in each case. If the `default` case is not needed,
use `// No default` instead.

## Line breaks
Try to keep lines shorter than 120 characters. If it's not possible, use line breaks.

## Imports
- Use single quotes for imports.
- Use relative paths for imports.
- Use `import * as` for imports that are not default exports.
- Use `import { ... }` for imports that are default exports.

For example:
```ts
// Bad
import { default as Foo } from "./foo";
import * from "./bar";

// Good
import Foo from "./foo";
import * as Bar from "./bar";
```

## Comments
- Use `//` for single line comments.
- Use `/* */` for multiline comments.
- Use `/** */` for JSDoc comments.
- Use `// TODO: ` for TODO comments.
- Don't use too many comments (like any Google tutorial). If the code is not clear enough, try to refactor it.

## HTML
- Use double quotes for HTML attributes.
- Write all HTML attributes and tags in lowercase.
    - Exception: `<!DOCTYPE html>` tag.
- Use tabs for indentation.
- Don't use `/` at the end of self-closing tags.
- Only use optional closing tags if it's needed (like `</p>`).
- Avoid using optional tags (like `<body>`).
    - Exception: When it's needed for attributes (like `<html lang="en">`).
	- If you use optional tags, use them in the same line and maintain the indentation.
- Use `class` instead of `id` for CSS selectors.
- Always use `utf-8` as charset.
- Use `async` and `defer` for scripts.
    - Only use `async` if the script is independent of the rest of the page.
- Preload CSS files.


For example:
```html
<!DOCTYPE html>
<html lang="en" dir="ltr">
<meta charset="utf-8">

<title>My amazing website</title>

<link rel="preload" href="style.css" as="style">
<link rel="stylesheet" href="style.css">

<h1>My amazing website</h1>
<p>This is my amazing website.
<p>It's amazing, isn't it?

<script src="script.js"></script>
```


## A cute skunk
![Alex is very cute! Isn't it?](./static-http/resources/img/alex-about-old.png)
