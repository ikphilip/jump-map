module.exports = {
  mode: 'production',
  entry: {
    main: './src/index.js'
  },
  output:{
    filename: './js/main.js',
    publicPath: '/assets/'
  }
}