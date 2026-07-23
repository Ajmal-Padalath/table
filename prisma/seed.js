const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database...');
  await prisma.payment.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.extra.deleteMany({});
  await prisma.variant.deleteMany({});
  await prisma.foodItem.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.table.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.restaurant.deleteMany({});

  console.log('Seeding restaurant...');
  const restaurant = await prisma.restaurant.create({
    data: {
      name: 'Gourmet Haven',
      description: 'Experiencing premium dining at its finest. Scan, order, and savor!',
      logo: '/images/restaurant-logo.png',
      phone: '+1 (555) 019-2834',
      email: 'hello@gourmethaven.com',
      address: '742 Culinary Avenue, Food District, NY 10001',
      taxRate: 5.0,
      serviceChargeRate: 10.0,
    },
  });

  console.log('Seeding staff users...');
  const adminPassword = await bcrypt.hash('admin123', 10);
  const kitchenPassword = await bcrypt.hash('kitchen123', 10);
  const waiterPassword = await bcrypt.hash('waiter123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Admin Manager',
      email: 'admin@restaurant.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  const kitchen = await prisma.user.create({
    data: {
      name: 'Head Chef',
      email: 'kitchen@restaurant.com',
      password: kitchenPassword,
      role: 'KITCHEN',
    },
  });

  const waiter = await prisma.user.create({
    data: {
      name: 'Senior Waiter',
      email: 'waiter@restaurant.com',
      password: waiterPassword,
      role: 'WAITER',
    },
  });

  console.log('Seeding tables...');
  const tableData = [
    { number: '1', capacity: 2, status: 'AVAILABLE' },
    { number: '2', capacity: 2, status: 'AVAILABLE' },
    { number: '3', capacity: 4, status: 'AVAILABLE' },
    { number: '4', capacity: 4, status: 'AVAILABLE' },
    { number: '5', capacity: 6, status: 'AVAILABLE' },
    { number: '6', capacity: 8, status: 'AVAILABLE' },
  ];

  for (const t of tableData) {
    await prisma.table.create({
      data: {
        number: t.number,
        capacity: t.capacity,
        status: t.status,
        qrCodeUrl: `/menu?table=${t.number}`,
      },
    });
  }

  console.log('Seeding categories...');
  const categories = [
    { name: 'Starters', slug: 'starters', image: '/images/categories/starters.jpg' },
    { name: 'Soups', slug: 'soups', image: '/images/categories/soups.jpg' },
    { name: 'Main Course', slug: 'main-course', image: '/images/categories/main-course.jpg' },
    { name: 'Pizza', slug: 'pizza', image: '/images/categories/pizza.jpg' },
    { name: 'Burgers', slug: 'burgers', image: '/images/categories/burgers.jpg' },
    { name: 'Drinks', slug: 'drinks', image: '/images/categories/drinks.jpg' },
    { name: 'Desserts', slug: 'desserts', image: '/images/categories/desserts.jpg' },
  ];

  const dbCategories = {};
  for (const cat of categories) {
    dbCategories[cat.slug] = await prisma.category.create({
      data: cat,
    });
  }

  console.log('Seeding food items...');
  
  // Starters
  const garlicBread = await prisma.foodItem.create({
    data: {
      name: 'Cheesy Garlic Bread',
      description: 'Toasted baguette slices brushed with garlic butter, topped with melted mozzarella and fresh oregano.',
      price: 6.99,
      rating: 4.6,
      isVeg: true,
      preparationTime: 8,
      isAvailable: true,
      image: '/images/menu/garlic-bread.jpg',
      categoryId: dbCategories['starters'].id,
    }
  });
  await prisma.extra.createMany({
    data: [
      { name: 'Extra Cheese', price: 1.50, foodItemId: garlicBread.id },
      { name: 'Sliced Jalapeños', price: 0.75, foodItemId: garlicBread.id },
    ]
  });

  const springRolls = await prisma.foodItem.create({
    data: {
      name: 'Crispy Veg Spring Rolls',
      description: 'Hand-rolled wrappers stuffed with seasoned shredded vegetables, fried golden-crisp, served with sweet chili dip.',
      price: 8.99,
      rating: 4.4,
      isVeg: true,
      preparationTime: 10,
      isAvailable: true,
      image: '/images/menu/spring-rolls.jpg',
      categoryId: dbCategories['starters'].id,
    }
  });

  // Soups
  const tomatoSoup = await prisma.foodItem.create({
    data: {
      name: 'Creamy Tomato Basil Soup',
      description: 'Slow-simmered vine-ripened tomatoes, fresh cream, and basil, served with crispy herb croutons.',
      price: 7.99,
      rating: 4.5,
      isVeg: true,
      preparationTime: 8,
      isAvailable: true,
      image: '/images/menu/tomato-soup.jpg',
      categoryId: dbCategories['soups'].id,
    }
  });

  // Pizza
  const pizzaMargherita = await prisma.foodItem.create({
    data: {
      name: 'Margherita Pizza',
      description: 'Classic Neapolitan-style thin crust pizza topped with fresh tomato sauce, mozzarella cheese, and fresh basil leaves.',
      price: 12.99,
      rating: 4.8,
      isVeg: true,
      preparationTime: 12,
      isAvailable: true,
      image: '/images/menu/margherita.jpg',
      categoryId: dbCategories['pizza'].id,
    }
  });
  await prisma.variant.createMany({
    data: [
      { name: 'Small 9"', price: 10.99, foodItemId: pizzaMargherita.id },
      { name: 'Medium 12"', price: 12.99, foodItemId: pizzaMargherita.id },
      { name: 'Large 14"', price: 15.99, foodItemId: pizzaMargherita.id },
    ]
  });
  await prisma.extra.createMany({
    data: [
      { name: 'Extra Cheese', price: 2.00, foodItemId: pizzaMargherita.id },
      { name: 'Mushrooms', price: 1.25, foodItemId: pizzaMargherita.id },
      { name: 'Olives', price: 1.00, foodItemId: pizzaMargherita.id },
    ]
  });

  const pizzaPepperoni = await prisma.foodItem.create({
    data: {
      name: 'Pepperoni Feast Pizza',
      description: 'Generous layers of premium beef pepperoni and mozzarella on our signature house-made crust.',
      price: 15.99,
      rating: 4.9,
      isVeg: false,
      preparationTime: 12,
      isAvailable: true,
      image: '/images/menu/pepperoni.jpg',
      categoryId: dbCategories['pizza'].id,
    }
  });
  await prisma.variant.createMany({
    data: [
      { name: 'Medium 12"', price: 15.99, foodItemId: pizzaPepperoni.id },
      { name: 'Large 14"', price: 18.99, foodItemId: pizzaPepperoni.id },
    ]
  });

  // Burgers
  const beefBurger = await prisma.foodItem.create({
    data: {
      name: 'Classic Beef Burger',
      description: 'Juicy grilled Angus beef patty topped with lettuce, tomatoes, red onions, gherkins, and house sauce on a toasted brioche bun.',
      price: 13.99,
      rating: 4.7,
      isVeg: false,
      preparationTime: 12,
      isAvailable: true,
      image: '/images/menu/beef-burger.jpg',
      categoryId: dbCategories['burgers'].id,
    }
  });
  await prisma.variant.createMany({
    data: [
      { name: 'Single Patty', price: 13.99, foodItemId: beefBurger.id },
      { name: 'Double Patty', price: 16.99, foodItemId: beefBurger.id },
    ]
  });
  await prisma.extra.createMany({
    data: [
      { name: 'Cheddar Cheese Slice', price: 1.00, foodItemId: beefBurger.id },
      { name: 'Crispy Bacon', price: 2.00, foodItemId: beefBurger.id },
    ]
  });

  const vegBurger = await prisma.foodItem.create({
    data: {
      name: 'Spicy Quinoa & Veggie Burger',
      description: 'Crispy veggie-grain patty, avocado spread, spicy chipotle mayo, baby spinach, served on a whole wheat bun.',
      price: 11.99,
      rating: 4.5,
      isVeg: true,
      preparationTime: 10,
      isAvailable: true,
      image: '/images/menu/veg-burger.jpg',
      categoryId: dbCategories['burgers'].id,
    }
  });

  // Main Course
  const grilledSalmon = await prisma.foodItem.create({
    data: {
      name: 'Lemon Herb Grilled Salmon',
      description: 'Premium Atlantic salmon fillet grilled to perfection, served with garlic mashed potatoes and steamed asparagus.',
      price: 24.99,
      rating: 4.8,
      isVeg: false,
      preparationTime: 18,
      isAvailable: true,
      image: '/images/menu/salmon.jpg',
      categoryId: dbCategories['main-course'].id,
    }
  });

  const alfredoPasta = await prisma.foodItem.create({
    data: {
      name: 'Penne Alfredo Pasta',
      description: 'Al dente penne pasta tossed in our creamy garlic Parmesan alfredo sauce, garnished with fresh parsley.',
      price: 16.99,
      rating: 4.6,
      isVeg: true,
      preparationTime: 14,
      isAvailable: true,
      image: '/images/menu/alfredo.jpg',
      categoryId: dbCategories['main-course'].id,
    }
  });
  await prisma.extra.createMany({
    data: [
      { name: 'Grilled Chicken Breast', price: 4.00, foodItemId: alfredoPasta.id },
      { name: 'Sautéed Mushrooms', price: 1.50, foodItemId: alfredoPasta.id },
    ]
  });

  // Drinks
  const limeSoda = await prisma.foodItem.create({
    data: {
      name: 'Fresh Mint Lime Soda',
      description: 'Muddled fresh mint leaves, key lime juice, and simple syrup, topped with chilled sparkling water.',
      price: 4.99,
      rating: 4.5,
      isVeg: true,
      preparationTime: 4,
      isAvailable: true,
      image: '/images/menu/lime-soda.jpg',
      categoryId: dbCategories['drinks'].id,
    }
  });

  const caramelLatte = await prisma.foodItem.create({
    data: {
      name: 'Iced Caramel Macchiato',
      description: 'Rich espresso poured over cold milk and sweet vanilla syrup, finished with a buttery caramel drizzle and ice.',
      price: 5.99,
      rating: 4.7,
      isVeg: true,
      preparationTime: 5,
      isAvailable: true,
      image: '/images/menu/iced-latte.jpg',
      categoryId: dbCategories['drinks'].id,
    }
  });

  // Desserts
  const lavaCake = await prisma.foodItem.create({
    data: {
      name: 'Warm Chocolate Lava Cake',
      description: 'Decadent chocolate cake with a molten liquid dark chocolate center, served with a scoop of premium vanilla bean ice cream.',
      price: 8.99,
      rating: 4.9,
      isVeg: true,
      preparationTime: 10,
      isAvailable: true,
      image: '/images/menu/lava-cake.jpg',
      categoryId: dbCategories['desserts'].id,
    }
  });

  const cheesecake = await prisma.foodItem.create({
    data: {
      name: 'Classic New York Cheesecake',
      description: 'Rich, smooth, and creamy slice of cheesecake on a sweet graham cracker crust, topped with strawberry coulis.',
      price: 9.99,
      rating: 4.7,
      isVeg: true,
      preparationTime: 5,
      isAvailable: true,
      image: '/images/menu/cheesecake.jpg',
      categoryId: dbCategories['desserts'].id,
    }
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
