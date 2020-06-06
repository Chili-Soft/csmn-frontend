module.exports = {
    devServer: {
        historyApiFallback: true,
        noInfo: true,
        overlay: true,
        proxy: {
            "/api": {
                ws: true,
                changeOrigin: true,
                target: "http://localhost:5000"
            }
        }
    }
}
