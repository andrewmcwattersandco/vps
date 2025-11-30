const { Builder } = require('../commands/node_modules/selenium-webdriver')

async function signin({ username, password }) {
  let driver = await new Builder().forBrowser('chrome').build()
  try {
    console.log('Opening RackNerd login page...')
    await driver.get('https://my.racknerd.com/index.php?rp=/login')
    
    if (username && password) {
      console.log(`Signing in as ${username}...`)
      // TODO: Implement automated login with credentials
      // For now, just log that credentials were provided
      console.log('Automated login not yet implemented.')
    }
    
    // Wait for user to complete login manually
    console.log('Please complete the login process in the browser window.')
    console.log('Press Ctrl+C when done, or the script will wait indefinitely.')
    
    // Keep the browser open - user can interact with it
    await new Promise(() => {}) // Wait indefinitely
  } catch (error) {
    console.error('Error during signin:', error.message)
    await driver.quit()
    process.exit(1)
  }
}

// Export service name for keytar to use
signin.serviceName = 'my.racknerd.com'

module.exports = signin
