const { Builder, By, until } = require('../commands/node_modules/selenium-webdriver')
const chrome = require('../commands/node_modules/selenium-webdriver/chrome')

async function signin({ username, password }) {
  const options = new chrome.Options()
  options.addArguments('--headless=new')
  options.addArguments('--disable-gpu')
  options.addArguments('--no-sandbox')
  options.addArguments('--disable-dev-shm-usage')
  
  let driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build()
  
  try {
    console.log('Opening RackNerd login page...')
    await driver.get('https://my.racknerd.com/index.php?rp=/login')
    
    if (username && password) {
      console.log(`Signing in as ${username}...`)
      
      // Wait for the username field to be present and visible
      const usernameField = await driver.wait(
        until.elementLocated(By.css('#inputEmail')),
        10000
      )
      // Wait for it to be visible and enabled
      await driver.wait(until.elementIsVisible(usernameField), 5000)
      await driver.wait(until.elementIsEnabled(usernameField), 5000)
      await usernameField.sendKeys(username)
      
      // Find and fill the password field
      const passwordField = await driver.findElement(By.css('#inputPassword'))
      await driver.wait(until.elementIsVisible(passwordField), 5000)
      await driver.wait(until.elementIsEnabled(passwordField), 5000)
      await passwordField.sendKeys(password)
      
      // Find and click the login button
      const loginButton = await driver.findElement(By.css('#login'))
      await driver.wait(until.elementIsVisible(loginButton), 5000)
      await driver.wait(until.elementIsEnabled(loginButton), 5000)
      await loginButton.click()
      
      console.log('Login submitted. Waiting for redirect...')
      
      // Wait for successful login (URL change or specific element)
      await driver.wait(async () => {
        const currentUrl = await driver.getCurrentUrl()
        return !currentUrl.includes('/login')
      }, 15000)
      
      console.log('Successfully signed in!')
      
      // Get and display the final URL
      const finalUrl = await driver.getCurrentUrl()
      console.log(`Logged in at: ${finalUrl}`)
    }
  } catch (error) {
    console.error('Error during signin:', error.message)
  } finally {
    await driver.quit()
  }
}

// Export service name for keytar to use
signin.serviceName = 'my.racknerd.com'

module.exports = signin
