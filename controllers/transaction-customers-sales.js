const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

//Create New Transaction
const createNewTransaction = async (req, res) => {
  try {
    const { customer_name, city, product_name, quantity } = req.body;

    //validation for customers
    const onlyLettersAndSpacing = /^[a-zA-Z\s]+$/;

    if (!customer_name && !city) {
      return res.status(400).json({ msg: "input name and city" });
    }
    if (!customer_name) {
      return res.status(400).json({ msg: "input name.." });
    }
    if (!city) {
      return res.status(400).json({ msg: "input city.." });
    }
    if (!onlyLettersAndSpacing.test(customer_name)) {
      return res.status(400).json({ msg: "input valid name with only letters.." });
    }
    if (!onlyLettersAndSpacing.test(city)) {
      return res.status(400).json({ msg: "input valid city with only letters.." });
    }

    //validation for sales
    if (!product_name) {
      return res.status(400).json({ msg: "input product.." });
    }
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ msg: "input quantity.." });
    }

    if (isNaN(quantity)) {
      return res.status(400).json({ msg: "input valid quantity only number.." });
    }

    //create transaction if all valid
    await prisma.$transaction(async (prisma) => {
      //create customer
      const newCustomer = await prisma.customers.create({
        data: { customer_name, city },
      });

      //create sales
      const newSales = await prisma.sales.create({
        data: { product_name, quantity, customers_id: newCustomer.id },
      });

      return res.json({
        msg: "success",
        data: {
          customer_name,
          city,
          product_name,
          quantity,
          created_at: newSales.created_at,
        },
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal server error" });
  }
};

//Read transaction data
const getAllTransaction = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || "";

    const totalRows = await prisma.sales.count({
      where: {
        OR: [
          { product_name: { contains: search, mode: "insensitive" } },

          {
            customers: {
              customer_name: { contains: search, mode: "insensitive" },
            },
          },
        ],
      },
    });

    // total pages
    const totalPages = Math.ceil(totalRows / limit);

    //fetch data with limit, pagination and search
    const join = await prisma.customers.findMany({
      take: limit,
      skip: offset,
      where: {
        OR: [
          { customer_name: { contains: search, mode: "insensitive" } },
          {
            sales: {
              some: {
                product_name: { contains: search, mode: "insensitive" },
              },
            },
          },
        ],
      },
      include: {
        sales: {
          select: {
            product_name: true,
            quantity: true,
            customers_id: true,
          },
        },
      },
      orderBy: {
        id: "desc",
      },
    });

    const results = join.map((result) => ({
      customer_name: result.customer_name,
      city: result.city,
      product_name: result.sales.map((sale) => sale.product_name)[0],
      quantity: result.sales.map((sale) => sale.quantity)[0],
      customers_id: result.sales.map((sale) => sale.customers_id)[0],
    }));

    return res.json({ results, totalRows, totalPages, page, limit, search });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal server error" });
  }
};

//update transaction
const updateTransaction = async (req, res) => {
  try {
    const { customer_name, city, product_name, quantity } = req.body;
    const customerId = Number(req.params.id);

    //validation for customers
    const onlyLettersAndSpacing = /^[a-zA-Z\s]+$/;

    if (!customer_name && !city) {
      return res.status(400).json({ msg: "input name and city" });
    }
    if (!customer_name) {
      return res.status(400).json({ msg: "input name.." });
    }
    if (!city) {
      return res.status(400).json({ msg: "input city.." });
    }
    if (!onlyLettersAndSpacing.test(customer_name)) {
      return res
        .status(400)
        .json({ msg: "input valid name with only letters.." });
    }
    if (!onlyLettersAndSpacing.test(city)) {
      return res
        .status(400)
        .json({ msg: "input valid city with only letters.." });
    }

    //validation for sales
    if (!product_name) {
      return res.status(400).json({ msg: "input product.." });
    }
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ msg: "input quantity.." });
    }

    if (isNaN(quantity)) {
      return res
        .status(400)
        .json({ msg: "input valid quantity only number.." });
    }

    // check existing customer join sales
    const existingCustomer = await prisma.customers.findUnique({
      where: { id: customerId },
      include: { sales: true },
    });

    if (!existingCustomer) {
      return res.status(400).json({ msg: "Customer not found" });
    }
    // Check if sales records exist
    if (!existingCustomer.sales || existingCustomer.sales.length === 0) {
      return res
        .status(400)
        .json({ msg: "No sales records found for the customer" });
    }

    //update transaction if all valid
    const updatedCustomer = await prisma.customers.update({
      where: { id: customerId },
      data: {
        customer_name,
        city,
        sales: {
          update: {
            where: { id: existingCustomer.sales[0].id },
            data: {
              product_name,
              quantity,
            },
          },
        },
      },
      include: {
        sales: {
          select: { product_name: true, quantity: true, customers_id: true },
        },
      },
    });

    const results = {
      customer_name: updatedCustomer.customer_name,
      city: updatedCustomer.city,
      product_name: updatedCustomer.sales[0].product_name,
      quantity: updatedCustomer.sales[0].quantity,
      customers_id: updatedCustomer.sales[0].customers_id,
    };

    return res.json({ msg: "successfully updated", data: results });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal server error" });
  }
};

//Delete Trransaction
const deleteTransaction = async (req, res) => {
  try {
    const customerId = Number(req.params.id);

    // Check if the customer exists
    const existingCustomer = await prisma.customers.findUnique({
      where: { id: customerId },
      include: { sales: true },
    });

    if (!existingCustomer) {
      return res.status(400).json({ msg: "Customer not found" });
    }

    // Delete associated sales
    await prisma.sales.deleteMany({
      where: { customers_id: customerId },
    });

    // Delete the customer
    await prisma.customers.delete({
      where: { id: customerId },
    });

    res.json({ msg: `${existingCustomer.customer_name} has been deleted` });
  } catch (error) {
    console.log(error)
    res.status(500).json({ msg: "Internal server error" });
  }
};

module.exports = {
  createNewTransaction,
  getAllTransaction,
  updateTransaction,
  deleteTransaction,
};
