import mongoose from 'mongoose';

const MAX_RETRIES = 3;
const RETRY_INTERVAL = 5000;

class DatabaseConnection {
  constructor() {
    this.retryCount = 0;
    this.isConnected = false;

    mongoose.set('strictQuery', true);

    mongoose.connection.on('connected', () => {
      console.log('Database connected');
      this.isConnected = true;
    });

    mongoose.connection.on('error', () => {
      console.log('Database connection error');
      this.isConnected = false;
    });

    mongoose.connection.on('disconnected', async () => {
      console.log('Database disconnected');
      this.isConnected = false;

      // Retry connection
      await this.handleConnectionError();
    });

    // Handle application termination
    process.on('SIGINT', this.handleAppTermination.bind(this));
    process.on('SIGTERM', this.handleAppTermination.bind(this));
  }

  async connect() {
    try {
      if (!process.env.MONGO_URI) {
        console.log('MONGO_URI not found');
        throw new Error('MONGO_URI not found');
      }

      const connectionOptions = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4
      };

      if (process.env.NODE_ENV === 'development') {
        mongoose.set('debug', true);
      }

      await mongoose.connect(process.env.MONGO_URI, connectionOptions);
      this.retryCount = 0;
    } catch (error) {
      console.log('Error connecting to database', error);
      await this.handleConnectionError();
    }
  }

  async handleConnectionError() {
    if (this.retryCount < MAX_RETRIES) {
      this.retryCount++;
      console.log(`Retrying connection ${this.retryCount} in ${MAX_RETRIES}ms`);
      await new Promise((resolve) =>
        setTimeout(() => {
          resolve();
        }, RETRY_INTERVAL)
      );
      return this.connect();
    } else {
      console.log('Max retries reached');
      process.exit(1);
    }
  }

  handleDisconnection() {
    if (!this.isConnected) {
      console.log('Attempting to reconnect to MongoDB...');
      this.connect();
    }
  }

  async handleAppTermination() {
    try {
      mongoose.connection.close();
      console.log('Database connection closed through app termination');
      process.exit(0);
    } catch (error) {
      console.log('Error closing database connection', error);
      process.exit(1);
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port
    };
  }
}

// create a singleton instance of the DatabaseConnection class
const dbConnection = new DatabaseConnection();

export default dbConnection.connect.bind(dbConnection);
export const getDbStatus = dbConnection.getConnectionStatus.bind(dbConnection);
