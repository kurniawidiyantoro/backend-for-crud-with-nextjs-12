const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const {format} = require ("date-fns")

//Create New Customer
const createNewCustomer = async (req, res) => {
  try {
    const { customer_name, city } = req.body;

    //only letter allowed
    const onlyLetters = /^[a-zA-Z]+$/;

    if (!customer_name && !city) {
      return res.json({ msg: "input name and city" });
    }
    if (!customer_name) {
      return res.json({ msg: "input name.." });
    }
    if (!city) {
      return res.json({ msg: "input city.." });
    }
    if (!onlyLetters.test(customer_name)) {
      return res.json({ msg: "input valid name with only letters.." });
    }
    if (!onlyLetters.test(city)) {
      return res.json({ msg: "input valid city with only letters.." });
    }

    //create customer if all valid
    const customer = await prisma.customers.create({
      data: { customer_name, city },
    });
    return res.json({ msg: "success", data: customer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal server error" });
  }
};

//Read All Customers
const getAllCustomers = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || "";

    const totalRows = await prisma.customers.count({
      where: {
        OR: [
          { customer_name: { contains: search, mode: "insensitive" } },

          {
            city: { contains: search, mode: "insensitive" },
          },
        ],
      },
    });

    // total pages
    const totalPages = Math.ceil(totalRows / limit);

    const customers = await prisma.customers.findMany({
      take: limit,
      skip: offset,
      where: {
        OR: [
          { customer_name: { contains: search, mode: "insensitive" } },

          {
            city: { contains: search, mode: "insensitive" },
          },
        ]
      },
    orderBy: {
        id:"desc"
      }
    });

    //format created at
    const formattedCustomers = customers.map((customer) => {
      return {
        ...customer,
        created_at: format(new Date(customer.created_at), "yyyy-MM-dd HH:mm:ss"),
      };
    });



    res.json({customers:formattedCustomers, totalRows, totalPages, page, limit, search});
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal server error" });
  }
};

//Read Customers by Id
const getCustomerById = async (req, res) => {
  try {
    const customer = await prisma.customers.findUnique({
      where: { id: Number(req.params.id) },
    });
    if (!customer) {
      return res.json({ msg: "customer not found.." });
    }
    return res.json(customer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal server error" });
  }
};

//Update Customer
const updateCustomer = async (req, res) => {
  try {
    const { customer_name, city } = req.body;
    const id = Number(req.params.id);

    //only letter allowed
    const onlyLetters = /^[a-zA-Z]+$/;

    if (!customer_name && !city) {
      return res.json({ msg: "input name and city" });
    }
    if (!customer_name) {
      return res.json({ msg: "input name.." });
    }
    if (!city) {
      return res.json({ msg: "input city.." });
    }
    if (!onlyLetters.test(customer_name)) {
      return res.json({ msg: "input valid name with only letters.." });
    }
    if (!onlyLetters.test(city)) {
      return res.json({ msg: "input valid city with only letters.." });
    }

    //update customer if all condition valid
    const customer = await prisma.customers.update({
      where: { id },
      data: { customer_name, city },
    });
    return res.json({ msg: "success update", data: customer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal server error" });
  }
};

//Delete Customer
const deleteCustomer = async (req, res) => {
  try {
    const customerId = req.params.id;
    const id = Number(customerId);

    if (!customerId) {
      return res.status(400).json({ msg: "need a customer ID" });
    }

    // Check if the customer exists
    const existCustomer = await prisma.customers.findUnique({
      where: {
        id,
      },
    });

    if (!existCustomer) {
      return res.status(404).json({ msg: "Customer not found." });
    }

    // Delete the customer if all condition valid
    await prisma.customers.delete({
      where: {
        id,
      },
    });
    return res.json({ msg: "Customer deleted successfully." });
  } catch (error) {}
};

module.exports = {
  createNewCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
};
