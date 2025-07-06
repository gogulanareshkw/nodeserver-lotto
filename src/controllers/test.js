exports.testGetHandler = function(req, res) {
    // #swagger.tags = ['Test']	
    // #swagger.summary = 'test json repsonse'
    res.setHeader('Content-Type', 'application/json')
    res.send(JSON.stringify({ greeting: 'Fasak!' }))
};
