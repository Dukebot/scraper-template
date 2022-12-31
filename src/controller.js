function Controller(app) {
    app.get('/', function (req, res) {
        res.send('Hello Wolrd!')
    })

    // ...
}

module.exports = Controller