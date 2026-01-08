const express = require('express');
const app = express();

app.get('/', (req: any, res: any) => {
    console.log(req);
    res.send('Hello World!');
});

app.listen(3000, () => {
    console.log('Server started on port 3000');
});