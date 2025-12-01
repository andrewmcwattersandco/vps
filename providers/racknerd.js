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
    
    // Check for CloudFlare challenge
    const pageTitle = await driver.getTitle()
    const pageSource = await driver.getPageSource()
    
    if (pageTitle.includes('Just a moment') || 
        pageSource.includes('Verifying you are human') ||
        pageSource.includes('cloudflare')) {
      console.error('Unable to connect due to CloudFlare challenge.')
      throw new Error('CloudFlare challenge detected')
    }
    
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

async function list({ username, password }) {
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
    // Login first
    await driver.get('https://my.racknerd.com/index.php?rp=/login')
    
    // Check for CloudFlare challenge
    const pageTitle = await driver.getTitle()
    const pageSource = await driver.getPageSource()
    
    if (pageTitle.includes('Just a moment') || 
        pageSource.includes('Verifying you are human') ||
        pageSource.includes('cloudflare')) {
      throw new Error('Permission denied to access provider "racknerd"')
    }
    
    const usernameField = await driver.wait(
      until.elementLocated(By.css('#inputEmail')),
      10000
    )
    await driver.wait(until.elementIsVisible(usernameField), 5000)
    await usernameField.sendKeys(username)
    
    const passwordField = await driver.findElement(By.css('#inputPassword'))
    await driver.wait(until.elementIsVisible(passwordField), 5000)
    await passwordField.sendKeys(password)
    
    const loginButton = await driver.findElement(By.css('#login'))
    await driver.wait(until.elementIsVisible(loginButton), 5000)
    await loginButton.click()
    
    // Wait for login to complete
    await driver.wait(async () => {
      const currentUrl = await driver.getCurrentUrl()
      return !currentUrl.includes('/login')
    }, 15000)
    
    // Navigate to services page
    await driver.get('https://my.racknerd.com/clientarea.php?action=services')
    
    // Wait for services table to load
    await driver.wait(
      until.elementLocated(By.css('#tableServicesList')),
      10000
    )
    
    // Scrape VPS information from table
    const vpses = []
    const serviceRows = await driver.findElements(By.css('#tableServicesList > tbody > tr'))
    
    for (const row of serviceRows) {
      try {
        // Get plan name from the first column
        const planElement = await row.findElement(By.css('td.sorting_1 > strong'))
        const plan = await planElement.getText()
        
        // Get pricing from the third column
        const pricingCell = await row.findElement(By.css('td:nth-child(3)'))
        const pricingRaw = await pricingCell.getText()
        const pricing = pricingRaw.replace(/\n/g, ' ').trim()
        
        // Get all cells in the row for parsing other data
        const cells = await row.findElements(By.css('td'))
        
        // Extract text from all cells for parsing
        const cellTexts = []
        for (const cell of cells) {
          const text = await cell.getText()
          cellTexts.push(text)
        }
        
        const rowText = cellTexts.join(' ')
        
        // Extract IP if present
        const ipMatch = rowText.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/)
        const ip = ipMatch ? ipMatch[1] : null
        
        // Extract status
        let status = 'Unknown'
        if (rowText.includes('Active')) status = 'Active'
        else if (rowText.includes('Suspended')) status = 'Suspended'
        else if (rowText.includes('Pending')) status = 'Pending'
        else if (rowText.includes('Cancelled')) status = 'Cancelled'
        
        vpses.push({
          name: plan,
          plan,
          ip,
          status,
          pricing,
          provider: 'racknerd'
        })
      } catch (err) {
        // Skip this row if we can't parse it
        continue
      }
    }
    
    return vpses
  } catch (error) {
    console.error('Error fetching VPS list:', error.message)
    return []
  } finally {
    await driver.quit()
  }
}

// Export service name for keytar to use
signin.serviceName = 'my.racknerd.com'
list.serviceName = 'my.racknerd.com'

module.exports = signin
module.exports.signin = signin
module.exports.list = list
module.exports.serviceName = 'my.racknerd.com'
