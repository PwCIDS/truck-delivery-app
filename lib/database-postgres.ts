import { getDbClient } from './db';

export interface Truck {
  id: number;
  number: string;
  plate: string;
  capacity: number;
  purchaseDate: string;
  status: 'available' | 'busy';
}

export interface Customer {
  id: number;
  code: string;
  name: string;
  address: string;
  phone: string;
  contact?: string;
}

export interface Delivery {
  id: number;
  truckId: number;
  customerId: number;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  destinations: string[];
  cargo: string;
  status: 'scheduled' | 'inprogress' | 'completed';
}

class DatabasePostgres {
  private sql = getDbClient();

  async getAllDeliveries(): Promise<Delivery[]> {
    const rows = await this.sql`
      SELECT id, truck_id, customer_id, start_date, start_time, end_date, end_time,
             destinations, cargo, status
      FROM deliveries
      ORDER BY start_date DESC, start_time DESC
    `;

    return rows.map(row => ({
      id: row.id,
      truckId: row.truck_id,
      customerId: row.customer_id,
      startDate: row.start_date,
      startTime: row.start_time,
      endDate: row.end_date,
      endTime: row.end_time,
      destinations: row.destinations,
      cargo: row.cargo,
      status: row.status as 'scheduled' | 'inprogress' | 'completed'
    }));
  }

  async getDeliveryById(id: number): Promise<Delivery | undefined> {
    const rows = await this.sql`
      SELECT id, truck_id, customer_id, start_date, start_time, end_date, end_time,
             destinations, cargo, status
      FROM deliveries
      WHERE id = ${id}
    `;

    if (rows.length === 0) return undefined;

    const row = rows[0];
    return {
      id: row.id,
      truckId: row.truck_id,
      customerId: row.customer_id,
      startDate: row.start_date,
      startTime: row.start_time,
      endDate: row.end_date,
      endTime: row.end_time,
      destinations: row.destinations,
      cargo: row.cargo,
      status: row.status as 'scheduled' | 'inprogress' | 'completed'
    };
  }

  async addDelivery(delivery: Omit<Delivery, 'id' | 'status'>): Promise<Delivery> {
    const status = this.getDeliveryStatus(
      delivery.startDate,
      delivery.startTime,
      delivery.endDate,
      delivery.endTime
    );

    const rows = await this.sql`
      INSERT INTO deliveries (truck_id, customer_id, start_date, start_time, end_date, end_time, destinations, cargo, status)
      VALUES (${delivery.truckId}, ${delivery.customerId}, ${delivery.startDate}, ${delivery.startTime},
              ${delivery.endDate}, ${delivery.endTime}, ${delivery.destinations}, ${delivery.cargo}, ${status})
      RETURNING id, truck_id, customer_id, start_date, start_time, end_date, end_time, destinations, cargo, status
    `;

    const row = rows[0];
    return {
      id: row.id,
      truckId: row.truck_id,
      customerId: row.customer_id,
      startDate: row.start_date,
      startTime: row.start_time,
      endDate: row.end_date,
      endTime: row.end_time,
      destinations: row.destinations,
      cargo: row.cargo,
      status: row.status as 'scheduled' | 'inprogress' | 'completed'
    };
  }

  async updateDelivery(id: number, delivery: Omit<Delivery, 'id' | 'status'>): Promise<boolean> {
    const status = this.getDeliveryStatus(
      delivery.startDate,
      delivery.startTime,
      delivery.endDate,
      delivery.endTime
    );

    const rows = await this.sql`
      UPDATE deliveries
      SET truck_id = ${delivery.truckId},
          customer_id = ${delivery.customerId},
          start_date = ${delivery.startDate},
          start_time = ${delivery.startTime},
          end_date = ${delivery.endDate},
          end_time = ${delivery.endTime},
          destinations = ${delivery.destinations},
          cargo = ${delivery.cargo},
          status = ${status}
      WHERE id = ${id}
      RETURNING id
    `;

    return rows.length > 0;
  }

  async deleteDelivery(id: number): Promise<boolean> {
    const rows = await this.sql`
      DELETE FROM deliveries
      WHERE id = ${id}
      RETURNING id
    `;

    return rows.length > 0;
  }

  private getDeliveryStatus(
    startDate: string,
    startTime: string,
    endDate: string,
    endTime: string
  ): 'scheduled' | 'inprogress' | 'completed' {
    const now = new Date();
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const startDateTime = new Date(startDate);
    startDateTime.setHours(startHour, startMinute);

    const endDateTime = new Date(endDate);
    endDateTime.setHours(endHour, endMinute);

    if (now < startDateTime) {
      return 'scheduled';
    } else if (now >= startDateTime && now <= endDateTime) {
      return 'inprogress';
    } else {
      return 'completed';
    }
  }

  async isTruckAvailable(
    truckId: number,
    startDate: string,
    startTime: string,
    endDate: string,
    endTime: string,
    excludeDeliveryId?: number
  ): Promise<boolean> {
    const [newStartHour, newStartMinute] = startTime.split(':').map(Number);
    const [newEndHour, newEndMinute] = endTime.split(':').map(Number);

    const newStartDateTime = new Date(startDate);
    newStartDateTime.setHours(newStartHour, newStartMinute, 0, 0);

    const newEndDateTime = new Date(endDate);
    newEndDateTime.setHours(newEndHour, newEndMinute, 0, 0);

    let rows;
    if (excludeDeliveryId) {
      rows = await this.sql`
        SELECT id FROM deliveries
        WHERE truck_id = ${truckId}
        AND id != ${excludeDeliveryId}
      `;
    } else {
      rows = await this.sql`
        SELECT id, start_date, start_time, end_date, end_time
        FROM deliveries
        WHERE truck_id = ${truckId}
      `;
    }

    for (const row of rows) {
      const [existingStartHour, existingStartMinute] = row.start_time.split(':').map(Number);
      const [existingEndHour, existingEndMinute] = row.end_time.split(':').map(Number);

      const existingStartDateTime = new Date(row.start_date);
      existingStartDateTime.setHours(existingStartHour, existingStartMinute, 0, 0);

      const existingEndDateTime = new Date(row.end_date);
      existingEndDateTime.setHours(existingEndHour, existingEndMinute, 0, 0);

      if (!(newEndDateTime <= existingStartDateTime || newStartDateTime >= existingEndDateTime)) {
        return false;
      }
    }

    return true;
  }

  async getAllTrucks(): Promise<Truck[]> {
    const rows = await this.sql`
      SELECT id, number, plate, capacity, purchase_date, status
      FROM trucks
      ORDER BY id
    `;

    return rows.map(row => ({
      id: row.id,
      number: row.number,
      plate: row.plate,
      capacity: row.capacity,
      purchaseDate: row.purchase_date,
      status: row.status as 'available' | 'busy'
    }));
  }

  async getTruckById(id: number): Promise<Truck | undefined> {
    const rows = await this.sql`
      SELECT id, number, plate, capacity, purchase_date, status
      FROM trucks
      WHERE id = ${id}
    `;

    if (rows.length === 0) return undefined;

    const row = rows[0];
    return {
      id: row.id,
      number: row.number,
      plate: row.plate,
      capacity: row.capacity,
      purchaseDate: row.purchase_date,
      status: row.status as 'available' | 'busy'
    };
  }

  async addTruck(truck: Omit<Truck, 'id' | 'status'>): Promise<Truck> {
    const rows = await this.sql`
      INSERT INTO trucks (number, plate, capacity, purchase_date, status)
      VALUES (${truck.number}, ${truck.plate}, ${truck.capacity}, ${truck.purchaseDate}, 'available')
      RETURNING id, number, plate, capacity, purchase_date, status
    `;

    const row = rows[0];
    return {
      id: row.id,
      number: row.number,
      plate: row.plate,
      capacity: row.capacity,
      purchaseDate: row.purchase_date,
      status: row.status as 'available' | 'busy'
    };
  }

  async updateTruck(id: number, truck: Omit<Truck, 'id' | 'status'>): Promise<boolean> {
    const rows = await this.sql`
      UPDATE trucks
      SET number = ${truck.number},
          plate = ${truck.plate},
          capacity = ${truck.capacity},
          purchase_date = ${truck.purchaseDate}
      WHERE id = ${id}
      RETURNING id
    `;

    return rows.length > 0;
  }

  async deleteTruck(id: number): Promise<boolean> {
    const hasDeliveries = await this.sql`
      SELECT COUNT(*) as count FROM deliveries WHERE truck_id = ${id}
    `;

    if (hasDeliveries[0].count > 0) {
      return false;
    }

    const rows = await this.sql`
      DELETE FROM trucks WHERE id = ${id} RETURNING id
    `;

    return rows.length > 0;
  }

  async getAllCustomers(): Promise<Customer[]> {
    const rows = await this.sql`
      SELECT id, code, name, address, phone, contact
      FROM customers
      ORDER BY id
    `;

    return rows.map(row => ({
      id: row.id,
      code: row.code,
      name: row.name,
      address: row.address,
      phone: row.phone,
      contact: row.contact || undefined
    }));
  }

  async getCustomerById(id: number): Promise<Customer | undefined> {
    const rows = await this.sql`
      SELECT id, code, name, address, phone, contact
      FROM customers
      WHERE id = ${id}
    `;

    if (rows.length === 0) return undefined;

    const row = rows[0];
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      address: row.address,
      phone: row.phone,
      contact: row.contact || undefined
    };
  }

  async addCustomer(customer: Omit<Customer, 'id'>): Promise<Customer> {
    const rows = await this.sql`
      INSERT INTO customers (code, name, address, phone, contact)
      VALUES (${customer.code}, ${customer.name}, ${customer.address}, ${customer.phone}, ${customer.contact || null})
      RETURNING id, code, name, address, phone, contact
    `;

    const row = rows[0];
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      address: row.address,
      phone: row.phone,
      contact: row.contact || undefined
    };
  }

  async updateCustomer(id: number, customer: Omit<Customer, 'id'>): Promise<boolean> {
    const rows = await this.sql`
      UPDATE customers
      SET code = ${customer.code},
          name = ${customer.name},
          address = ${customer.address},
          phone = ${customer.phone},
          contact = ${customer.contact || null}
      WHERE id = ${id}
      RETURNING id
    `;

    return rows.length > 0;
  }

  async deleteCustomer(id: number): Promise<boolean> {
    const hasDeliveries = await this.sql`
      SELECT COUNT(*) as count FROM deliveries WHERE customer_id = ${id}
    `;

    if (hasDeliveries[0].count > 0) {
      return false;
    }

    const rows = await this.sql`
      DELETE FROM customers WHERE id = ${id} RETURNING id
    `;

    return rows.length > 0;
  }
}

let dbInstance: DatabasePostgres | null = null;

export function getDatabasePostgres(): DatabasePostgres {
  if (!dbInstance) {
    dbInstance = new DatabasePostgres();
  }
  return dbInstance;
}
