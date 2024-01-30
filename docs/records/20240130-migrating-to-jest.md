# Migrating from the native NodeJS Test Runner to Jest

Using the NodeJS Test Runner involved the following devDependencies:

1. `glob`: global search util
2. `tsx`: runs `.ts` files on cli
3. `c8`: code coverage for node test runner

And also defined the following package scripts to run tests:

```json
"test": "glob -c \"node --import tsx --test --no-warnings \" \"./src/**/*.test.ts\"",
"test:file": "glob -c \"node --import tsx --test --no-warnings \"",
"test:coverage": "glob -c \"c8 node --test --import tsx --no-warnings\" \"./src/**/*.test.ts\"",
"test:debug": "glob -c \"node --import tsx --no-warnings --test\" \"./src/**/*.test.ts\"",
```

Initially, the project used the native Node test runner to keep things simple and reduce dependencies. However, using it effectively required the extra packages mentioned above, largely defeating the latter purpose.

The decision was made to migrate from the native test runner to Jest due to difficulties with maintaining code coverage:

1. Faced bugs with `c8` multiple times where it would inaccurately compute code coverage for a file as 100% as long as ANY line of code in that file has been covered.
2. The native test runner's coverage option, while good, was still experimental and did not have easy options to throw console errors if the coverage is below a threshold.

Migrating to Jest would avoid the above issues due to its well-established coverage capabilities and also allow access to its larger suite of features as well as comprehensive documentation. Jest is also simple enough and similar enough in syntax to the native Node test runner that the migration could be done in less than half a day.
