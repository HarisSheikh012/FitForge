import { PrismaClient, UserRole, Gender, MembershipStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ─────────────────────────────────────────────
  // 1. Super Admin
  // ─────────────────────────────────────────────
  const superAdminPassword = await bcrypt.hash('Admin@123!', 12);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@gymapp.com' },
    update: {},
    create: {
      email: 'superadmin@gymapp.com',
      password: superAdminPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: UserRole.SUPER_ADMIN,
      isEmailVerified: true,
      isActive: true,
    },
  });
  console.log('✅ Super Admin created:', superAdmin.email);

  // ─────────────────────────────────────────────
  // 2. SaaS Plans
  // ─────────────────────────────────────────────
  const freePlan = await prisma.saasPlan.upsert({
    where: { id: 'saas-plan-free' },
    update: {},
    create: {
      id: 'saas-plan-free',
      name: 'Free Trial',
      type: 'FREE',
      price: 0,
      billingInterval: 'MONTHLY',
      features: {
        maxMembers: 50,
        maxBranches: 1,
        maxTrainers: 5,
        maxStaff: 3,
        reports: false,
        customBranding: false,
        apiAccess: false,
      },
      isActive: true,
    },
  });

  const basicPlan = await prisma.saasPlan.upsert({
    where: { id: 'saas-plan-basic' },
    update: {},
    create: {
      id: 'saas-plan-basic',
      name: 'Basic',
      type: 'BASIC',
      price: 4999,
      billingInterval: 'MONTHLY',
      features: {
        maxMembers: 200,
        maxBranches: 2,
        maxTrainers: 15,
        maxStaff: 10,
        reports: true,
        customBranding: false,
        apiAccess: false,
      },
      isActive: true,
    },
  });

  const proPlan = await prisma.saasPlan.upsert({
    where: { id: 'saas-plan-pro' },
    update: {},
    create: {
      id: 'saas-plan-pro',
      name: 'Pro',
      type: 'PRO',
      price: 9999,
      billingInterval: 'MONTHLY',
      features: {
        maxMembers: 1000,
        maxBranches: 5,
        maxTrainers: 50,
        maxStaff: 25,
        reports: true,
        customBranding: true,
        apiAccess: true,
      },
      isActive: true,
    },
  });

  console.log('✅ SaaS Plans created');

  // ─────────────────────────────────────────────
  // 3. Gym Owner
  // ─────────────────────────────────────────────
  const ownerPassword = await bcrypt.hash('Owner@123!', 12);
  const gymOwner = await prisma.user.upsert({
    where: { email: 'owner@fitlife.com' },
    update: {},
    create: {
      email: 'owner@fitlife.com',
      password: ownerPassword,
      firstName: 'Ahmed',
      lastName: 'Khan',
      phone: '+92-300-1234567',
      role: UserRole.GYM_OWNER,
      isEmailVerified: true,
      isActive: true,
    },
  });

  // ─────────────────────────────────────────────
  // 4. Gym
  // ─────────────────────────────────────────────
  const gym = await prisma.gym.upsert({
    where: { slug: 'fitlife-gym' },
    update: {},
    create: {
      name: 'FitLife Gym',
      slug: 'fitlife-gym',
      description: 'Premium fitness center with state-of-the-art equipment',
      email: 'info@fitlife.com',
      phone: '+92-42-1234567',
      address: '123 Main Boulevard',
      city: 'Lahore',
      state: 'Punjab',
      country: 'PK',
      timezone: 'Asia/Karachi',
      currency: 'PKR',
      taxRate: 5,
      ownerId: gymOwner.id,
      isActive: true,
    },
  });
  console.log('✅ Gym created:', gym.name);

  // Update owner's gymId
  await prisma.user.update({
    where: { id: gymOwner.id },
    data: { gymId: gym.id },
  });

  // ─────────────────────────────────────────────
  // 5. Gym Subscription (Pro Trial)
  // ─────────────────────────────────────────────
  await prisma.gymSubscription.upsert({
    where: { gymId: gym.id },
    update: {},
    create: {
      gymId: gym.id,
      planId: proPlan.id,
      status: 'TRIAL',
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // ─────────────────────────────────────────────
  // 6. Operating Hours
  // ─────────────────────────────────────────────
  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] as const;
  for (const day of days) {
    await prisma.operatingHour.upsert({
      where: { gymId_dayOfWeek: { gymId: gym.id, dayOfWeek: day } },
      update: {},
      create: {
        gymId: gym.id,
        dayOfWeek: day,
        openTime: '06:00',
        closeTime: day === 'SUNDAY' ? '14:00' : '22:00',
        isClosed: false,
      },
    });
  }

  // ─────────────────────────────────────────────
  // 7. Main Branch
  // ─────────────────────────────────────────────
  const mainBranch = await prisma.branch.upsert({
    where: { id: 'branch-main-fitlife' },
    update: {},
    create: {
      id: 'branch-main-fitlife',
      gymId: gym.id,
      name: 'Main Branch - Lahore',
      address: '123 Main Boulevard',
      city: 'Lahore',
      phone: '+92-42-1234567',
      isMain: true,
      isActive: true,
    },
  });

  // ─────────────────────────────────────────────
  // 8. Membership Plans
  // ─────────────────────────────────────────────
  const plans = await Promise.all([
    prisma.membershipPlan.upsert({
      where: { id: 'plan-monthly' },
      update: {},
      create: {
        id: 'plan-monthly',
        gymId: gym.id,
        name: 'Monthly',
        durationDays: 30,
        price: 3000,
        features: ['Full Gym Access', 'Locker Room', 'Free Parking'],
        isActive: true,
        sortOrder: 1,
      },
    }),
    prisma.membershipPlan.upsert({
      where: { id: 'plan-quarterly' },
      update: {},
      create: {
        id: 'plan-quarterly',
        gymId: gym.id,
        name: 'Quarterly',
        durationDays: 90,
        price: 8000,
        discountPrice: 7500,
        features: ['Full Gym Access', 'Locker Room', 'Free Parking', '1 Personal Training Session'],
        isActive: true,
        isFeatured: true,
        sortOrder: 2,
      },
    }),
    prisma.membershipPlan.upsert({
      where: { id: 'plan-half-yearly' },
      update: {},
      create: {
        id: 'plan-half-yearly',
        gymId: gym.id,
        name: 'Half Yearly',
        durationDays: 180,
        price: 15000,
        discountPrice: 13000,
        features: ['Full Gym Access', 'Locker Room', 'Free Parking', '3 Personal Training Sessions', 'Nutrition Plan'],
        isActive: true,
        sortOrder: 3,
      },
    }),
    prisma.membershipPlan.upsert({
      where: { id: 'plan-yearly' },
      update: {},
      create: {
        id: 'plan-yearly',
        gymId: gym.id,
        name: 'Yearly',
        durationDays: 365,
        price: 28000,
        discountPrice: 24000,
        features: [
          'Full Gym Access', 'Locker Room', 'Free Parking',
          'Unlimited Personal Training', 'Nutrition Plan', 'Body Assessment',
          'Guest Passes (2)',
        ],
        isActive: true,
        sortOrder: 4,
      },
    }),
  ]);
  console.log('✅ Membership Plans created');

  // ─────────────────────────────────────────────
  // 9. Trainer
  // ─────────────────────────────────────────────
  const trainerPassword = await bcrypt.hash('Trainer@123!', 12);
  const trainerUser = await prisma.user.upsert({
    where: { email: 'trainer@fitlife.com' },
    update: {},
    create: {
      email: 'trainer@fitlife.com',
      password: trainerPassword,
      firstName: 'Bilal',
      lastName: 'Ahmed',
      phone: '+92-301-9876543',
      role: UserRole.TRAINER,
      isEmailVerified: true,
      isActive: true,
      gymId: gym.id,
    },
  });

  const trainer = await prisma.trainer.upsert({
    where: { userId: trainerUser.id },
    update: {},
    create: {
      gymId: gym.id,
      branchId: mainBranch.id,
      userId: trainerUser.id,
      employeeId: 'TRN-001',
      specializations: ['Weight Training', 'CrossFit', 'HIIT', 'Nutrition'],
      certifications: ['NASM-CPT', 'CrossFit Level 2'],
      experience: 5,
      salary: 50000,
      bio: 'Certified personal trainer with 5+ years of experience in strength training and fitness coaching.',
      rating: 4.8,
      isActive: true,
    },
  });
  console.log('✅ Trainer created');

  // ─────────────────────────────────────────────
  // 10. Staff
  // ─────────────────────────────────────────────
  const staffPassword = await bcrypt.hash('Staff@123!', 12);
  const staffUser = await prisma.user.upsert({
    where: { email: 'staff@fitlife.com' },
    update: {},
    create: {
      email: 'staff@fitlife.com',
      password: staffPassword,
      firstName: 'Sara',
      lastName: 'Malik',
      phone: '+92-302-5551234',
      role: UserRole.STAFF,
      isEmailVerified: true,
      isActive: true,
      gymId: gym.id,
    },
  });

  await prisma.staff.upsert({
    where: { userId: staffUser.id },
    update: {},
    create: {
      gymId: gym.id,
      branchId: mainBranch.id,
      userId: staffUser.id,
      employeeId: 'STF-001',
      department: 'Front Desk',
      position: 'Receptionist',
      salary: 30000,
      isActive: true,
    },
  });
  console.log('✅ Staff created');

  // ─────────────────────────────────────────────
  // 11. Members (5 demo members)
  // ─────────────────────────────────────────────
  const memberPassword = await bcrypt.hash('Member@123!', 12);
  const memberData = [
    { email: 'member@fitlife.com', firstName: 'Ali', lastName: 'Hassan', gender: Gender.MALE, phone: '+92-300-1111111' },
    { email: 'zara@fitlife.com', firstName: 'Zara', lastName: 'Khan', gender: Gender.FEMALE, phone: '+92-300-2222222' },
    { email: 'usman@fitlife.com', firstName: 'Usman', lastName: 'Iqbal', gender: Gender.MALE, phone: '+92-300-3333333' },
    { email: 'ayesha@fitlife.com', firstName: 'Ayesha', lastName: 'Siddiqui', gender: Gender.FEMALE, phone: '+92-300-4444444' },
    { email: 'hamza@fitlife.com', firstName: 'Hamza', lastName: 'Raza', gender: Gender.MALE, phone: '+92-300-5555555' },
  ];

  for (let i = 0; i < memberData.length; i++) {
    const md = memberData[i];
    const mUser = await prisma.user.upsert({
      where: { email: md.email },
      update: {},
      create: {
        email: md.email,
        password: memberPassword,
        firstName: md.firstName,
        lastName: md.lastName,
        phone: md.phone,
        role: UserRole.MEMBER,
        isEmailVerified: true,
        isActive: true,
        gymId: gym.id,
      },
    });

    const member = await prisma.member.upsert({
      where: { userId: mUser.id },
      update: {},
      create: {
        gymId: gym.id,
        branchId: mainBranch.id,
        userId: mUser.id,
        memberId: `GYM-${String(i + 1).padStart(4, '0')}`,
        gender: md.gender,
        trainerId: trainer.id,
        membershipStatus: MembershipStatus.ACTIVE,
        joinedAt: new Date(Date.now() - (i * 15 + 30) * 24 * 60 * 60 * 1000),
        emergencyName: 'Emergency Contact',
        emergencyPhone: '+92-300-9999999',
        emergencyRelation: 'Spouse',
      },
    });

    // Subscription
    const planId = i < 3 ? plans[1].id : plans[0].id; // quarterly or monthly
    const planObj = i < 3 ? plans[1] : plans[0];
    const startDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
    const endDate = new Date(startDate.getTime() + planObj.durationDays * 24 * 60 * 60 * 1000);

    const subscription = await prisma.subscription.upsert({
      where: { id: `sub-${member.id}` },
      update: {},
      create: {
        id: `sub-${member.id}`,
        memberId: member.id,
        planId: planId,
        startDate,
        endDate,
        status: MembershipStatus.ACTIVE,
        price: planObj.discountPrice ?? planObj.price,
      },
    });

    // Payment
    await prisma.payment.create({
      data: {
        gymId: gym.id,
        memberId: member.id,
        subscriptionId: subscription.id,
        amount: planObj.discountPrice ?? planObj.price,
        currency: 'PKR',
        method: PaymentMethod.CASH,
        status: PaymentStatus.COMPLETED,
        paidAt: startDate,
      },
    });

    // Attendance (last 7 days)
    for (let d = 0; d < 7; d++) {
      if (Math.random() > 0.3) {
        const checkIn = new Date(Date.now() - d * 24 * 60 * 60 * 1000);
        checkIn.setHours(7 + Math.floor(Math.random() * 4), 0, 0, 0);
        await prisma.attendance.create({
          data: {
            gymId: gym.id,
            branchId: mainBranch.id,
            memberId: member.id,
            checkIn,
            checkOut: new Date(checkIn.getTime() + 90 * 60 * 1000),
            method: 'QR',
            status: 'CHECKED_OUT',
          },
        });
      }
    }
  }
  console.log('✅ Members and subscriptions created');

  // ─────────────────────────────────────────────
  // 12. Classes
  // ─────────────────────────────────────────────
  const classData = [
    { name: 'Morning Yoga', category: 'YOGA', capacity: 15, duration: 60, level: 'BEGINNER' },
    { name: 'CrossFit HIIT', category: 'CROSSFIT', capacity: 20, duration: 45, level: 'INTERMEDIATE' },
    { name: 'Cardio Blast', category: 'CARDIO', capacity: 25, duration: 45, level: 'ALL' },
    { name: 'Pilates Core', category: 'PILATES', capacity: 12, duration: 50, level: 'ALL' },
    { name: 'Strength Training', category: 'WEIGHTLIFTING', capacity: 10, duration: 60, level: 'ADVANCED' },
  ];

  for (const cd of classData) {
    await prisma.class.create({
      data: {
        gymId: gym.id,
        branchId: mainBranch.id,
        trainerId: trainer.id,
        ...cd,
        isActive: true,
      },
    });
  }
  console.log('✅ Classes created');

  // ─────────────────────────────────────────────
  // 13. Equipment
  // ─────────────────────────────────────────────
  const equipmentData = [
    { name: 'Treadmill Pro X1', category: 'CARDIO', brand: 'Life Fitness', quantity: 5, purchasePrice: 150000 },
    { name: 'Smith Machine', category: 'STRENGTH', brand: 'Body-Solid', quantity: 2, purchasePrice: 200000 },
    { name: 'Dumbbells Set (5-50kg)', category: 'FREE_WEIGHTS', brand: 'Rogue', quantity: 1, purchasePrice: 80000 },
    { name: 'Rowing Machine', category: 'CARDIO', brand: 'Concept2', quantity: 3, purchasePrice: 120000 },
    { name: 'Cable Machine', category: 'STRENGTH', brand: 'Precor', quantity: 2, purchasePrice: 250000 },
  ];

  for (const ed of equipmentData) {
    await prisma.equipment.create({
      data: {
        gymId: gym.id,
        ...ed,
        status: 'OPERATIONAL',
        purchaseDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
        nextServiceDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    });
  }
  console.log('✅ Equipment created');

  // ─────────────────────────────────────────────
  // 14. Coupon
  // ─────────────────────────────────────────────
  await prisma.coupon.upsert({
    where: { code: 'WELCOME20' },
    update: {},
    create: {
      gymId: gym.id,
      code: 'WELCOME20',
      description: '20% off on first membership',
      discountType: 'PERCENT',
      discountValue: 20,
      maxUses: 100,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
  });
  console.log('✅ Coupon created');

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📋 Demo Credentials:');
  console.log('  Super Admin:  superadmin@gymapp.com / Admin@123!');
  console.log('  Gym Owner:    owner@fitlife.com / Owner@123!');
  console.log('  Staff:        staff@fitlife.com / Staff@123!');
  console.log('  Trainer:      trainer@fitlife.com / Trainer@123!');
  console.log('  Member:       member@fitlife.com / Member@123!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
