These code snippets could be used to extend TerriaJS-Server.

```
// For testing, simply reflects stuff back at the caller.
app.get('/reflect', function(req, res){
    res.status(200).send(req.headers);
});
import bodyParser from "body-parser";
app.post('/reflect', bodyParser.urlencoded({extended: true, type: function() { return true; }}), function(req, res) {
    const response = {
        body: req.body,
        headers: req.headers
    };

    res.status(200).send(response);
});
```

```
// Sample simple NM service. To use, place this above the fallback redirection.
app.post('/nm_service_1', async function(req, res, next) {
    const formidable = await import('formidable');
    //receive the posted object
    const form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
        //create a layer for NM to display
        const obj = {
            name: 'Bikes Available',
            type: 'DATA',
            proxy: false,
            url: 'http://nationalmap.nicta.com.au/test/bike_racks.geojson'
        };
        //send a response with the object and display text
        res.json({ displayHtml: 'Here are the available bike racks.', layer: obj});
    });
});
```