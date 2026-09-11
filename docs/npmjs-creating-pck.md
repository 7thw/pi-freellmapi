# Creating a package.json file | npm Docs

Table of contents

You can add a `package.json` file to your package to make it easy for others to manage and install. Packages published to the registry must contain a `package.json` file.

A `package.json` file:

-   lists the packages your project depends on
-   specifies versions of a package that your project can use using [semantic versioning rules](https://docs.npmjs.com/about-semantic-versioning)
-   makes your build reproducible, and therefore easier to share with other developers

**Note:** To make your package easier to find on the npm website, we recommend including a custom `description` in your `package.json` file.

## [`package.json` fields](#packagejson-fields)

## [Required `name` and `version` fields](#required-name-and-version-fields)

A `package.json` file must contain `"name"` and `"version"` fields.

The `"name"` field contains your package's name and _must_ be lowercase _without_ any spaces. May contain _hyphens_, _dots_, and _underscores_.

The `"version"` field must be in the form `x.x.x` and follow the [semantic versioning guidelines](https://docs.npmjs.com/about-semantic-versioning).

If you want inclusive package author information, in the `"author"` field use the following format (email and website are both optional):

`Your Name <email@example.com> (https://example.com)`

## [Example](#example)

{

  "name": "my-awesome-package",

  "version": "1.0.0",

  "author": "Your Name <email@example.com> (https://example.com)"

}

## [Creating a new `package.json` file](#creating-a-new-packagejson-file)

You can create a `package.json` file by running a CLI questionnaire or creating a default `package.json` file.

## [Running a CLI questionnaire](#running-a-cli-questionnaire)

To create a `package.json` file with values that you supply, use the `npm init` command.

1.  On the command line, navigate to the root directory of your package.
    
    `cd /path/to/package`
2.  Run the following command:
    
    `npm init`
3.  Answer the questions in the command line questionnaire.
    

### [Customizing the `package.json` questionnaire](#customizing-the-packagejson-questionnaire)

If you expect to create many `package.json` files, you can customize the questions asked and fields created during the `init` process so all the `package.json` files contain a standard set of information.

1.  In your home directory, create a file called `.npm-init.js`.
    
2.  To add custom questions, using a text editor, add questions with the `prompt` function:
    
    `module.exports = prompt("what's your favorite flavor of ice cream, buddy?", "I LIKE THEM ALL");`
3.  To add custom fields, using a text editor, add desired fields to the `.npm-init.js` file:
    
    module.exports \= {
    
      customField: 'Example custom field',
    
      otherCustomField: 'This example field is really cool'
    
    }
    

To learn more about creating advanced `npm init` customizations, see the [init-package-json GitHub repository](https://github.com/npm/init-package-json).

## [Creating a default `package.json` file](#creating-a-default-packagejson-file)

To create a default `package.json` using information extracted from the current directory, use the `npm init` command with the `--yes` or `-y` flag. For a list of default values, see "[Default values extracted from the current directory](#default-values-extracted-from-the-current-directory)".

1.  On the command line, navigate to the root directory of your package.
    
    `cd /path/to/package`
2.  Run the following command:
    
    `npm init --yes`

### [Example](#example-1)

\> npm init \--yes

Wrote to /home/monatheoctocat/my\_package/package.json:

{

  "name": "my\_package",

  "description": "make your package easier to find on the npm website",

  "version": "1.0.0",

  "scripts": {

    "test": "echo \\"Error: no test specified\\" && exit 1"

  },

  "repository": {

    "type": "git",

    "url": "https://github.com/monatheoctocat/my\_package.git"

  },

  "keywords": \[\],

  "author": "",

  "license": "ISC",

  "bugs": {

    "url": "https://github.com/monatheoctocat/my\_package/issues"

  },

  "homepage": "https://github.com/monatheoctocat/my\_package"

}

-   `name`: the current directory name
-   `version`: always `1.0.0`
-   `description`: info about the package, or an empty string `""`
-   `scripts`: by default creates an empty `test` script
-   `keywords`: empty
-   `author`: empty
-   `license`: [`ISC`](https://opensource.org/licenses/ISC)
-   `bugs`: information from the current directory, if present
-   `homepage`: information from the current directory, if present

## [Setting config options for the init command](#setting-config-options-for-the-init-command)

You can set default config options for the `npm init` command. For example, to set the default author email, author name, and license, on the command line, run the following commands:

\> npm set init-author-email "example-user@example.com"

\> npm set init-author-name "example\_user"

\> npm set init-license "MIT"