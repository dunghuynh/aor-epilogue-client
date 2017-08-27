# Epilogue client for admin-on-rest

For using [Epilogue](https://github.com/dchester/epilogue) with [admin-on-rest](https://github.com/marmelab/admin-on-rest), use the `epilogueClient` function to convert AOR's REST dialect into one compatible with Epilogue.

## Installation

```sh
npm install aor-epilogue-client --save
or
yarn add aor-epilogue-client
```

## Usage

```js
// in src/App.js
import React from 'react';
import { Admin, Resource } from 'admin-on-rest';
import epilogueClient from 'aor-epilogue-client';
import { PostList } from './posts';

const App = () => (
    <Admin restClient={epilogueClient('/my_epilogue_endpoint')}>
        <Resource name="posts" list={PostList} />
    </Admin>
);

export default App;
```

## License

This library is licensed under the [MIT Licence](LICENSE)
