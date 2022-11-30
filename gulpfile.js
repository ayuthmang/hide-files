const { src, task } = require('gulp')
const clean = require('gulp-clean')

task('clean', () => {
  const sources = ['src', 'bin']
  const files = sources.map((source) => [
    `${source}/**/*.js`,
    `${source}/**/*.d.ts`,
    `${source}/**/*.js.map`,
    `${source}/**/*.d.ts.map`,
  ])
  return src(files.flat(), {
    read: false,
  }).pipe(clean())
})
