const { Service, EventLogger } = require('node-windows');

// Create a new service object
const svc = new Service({
  name: 'Parle Location Service',
  description: 'Parle Location Service backend application.',
  script: 'D:\\Ujjawal\\location\\backend\\parle.js', // Path to your Node.js application
});

// Create an event logger
const log = new EventLogger('Parle Location Service');

// Get the command from command-line arguments
const command = process.argv[2];

// Handle commands
if (command === 'install') {
  // Listen for the "install" event
  svc.on('install', () => {
    log.info('Service installed successfully.');
    console.log('Service installed successfully!');
    svc.start(); // Start the service after installation
  });

  // Listen for the "alreadyinstalled" event
  svc.on('alreadyinstalled', () => {
    log.warn('Service is already installed.');
    console.log('Service is already installed.');
  });

  // Install the service
  svc.install();
} else if (command === 'uninstall') {
  // Listen for the "uninstall" event
  svc.on('uninstall', () => {
    log.info('Service uninstalled successfully.');
    console.log('Service uninstalled successfully!');
  });

  // Uninstall the service
  svc.uninstall();
} else if (command === 'log') {
  // Log custom messages to the Windows Event Viewer
  log.info('Custom log: Parle Location Service is running smoothly.');
  log.warn('Custom log: This is a warning message.');
  log.error('Custom log: This is an error message.');
  console.log('Custom log messages have been sent to the Windows Event Viewer.');
} else {
  console.log('Invalid command! Use one of the following:');
}
