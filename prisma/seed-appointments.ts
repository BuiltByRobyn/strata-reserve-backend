import prisma from '../src/shared/lib/prismaClient'

async function main() {
  // Seed time slots
  const timeSlots = [
    { slotTime: '10:00', slotName: 'Morning' },
    { slotTime: '14:00', slotName: 'Afternoon' },
    { slotTime: '18:00', slotName: 'Evening' },
  ];

  for (const slot of timeSlots) {
    const existing = await prisma.appointmentTimeSlot.findFirst({
      where: { slotTime: slot.slotTime }
    });
    if (!existing) {
      await prisma.appointmentTimeSlot.create({ data: slot });
      console.log(`Created time slot: ${slot.slotName} (${slot.slotTime})`);
    } else {
      console.log(`Time slot already exists: ${slot.slotName} (${slot.slotTime})`);
    }
  }

  // Get services to link appointment types
  const services = await prisma.service.findMany();
  console.log('Services:', services.map(s => `${s.serviceId}: ${s.serviceName}`).join(', '));

  if (services.length === 0) {
    console.log('No services found - skipping appointment type seeding');
    return;
  }

  const defaultServiceId = services[0].serviceId;

  // Seed appointment types
  const appointmentTypes = [
    { typeName: 'Half Day Inspection', durationType: 'Half Day', isDraftMeeting: false, serviceId: defaultServiceId },
    { typeName: 'Full Day Inspection', durationType: 'Full Day', isDraftMeeting: false, serviceId: defaultServiceId },
    { typeName: 'Draft Meeting', durationType: 'Evening', isDraftMeeting: true, serviceId: defaultServiceId },
  ];

  for (const apt of appointmentTypes) {
    const existing = await prisma.appointmentType.findFirst({
      where: { typeName: apt.typeName }
    });
    if (!existing) {
      const created = await prisma.appointmentType.create({ data: apt });
      console.log(`Created appointment type: ${apt.typeName} (ID: ${created.appointmentTypeId})`);

      // Link time slots to appointment types
      const allSlots = await prisma.appointmentTimeSlot.findMany();
      if (apt.isDraftMeeting) {
        // Draft meeting only gets evening slot
        const eveningSlot = allSlots.find(s => s.slotTime === '18:00');
        if (eveningSlot) {
          await prisma.appointmentTypeTimeSlot.create({
            data: { appointmentTypeId: created.appointmentTypeId, timeSlotId: eveningSlot.timeSlotId }
          });
        }
      } else {
        // Inspections get morning and afternoon slots
        for (const slot of allSlots.filter(s => s.slotTime !== '18:00')) {
          await prisma.appointmentTypeTimeSlot.create({
            data: { appointmentTypeId: created.appointmentTypeId, timeSlotId: slot.timeSlotId }
          });
        }
      }
    } else {
      console.log(`Appointment type already exists: ${apt.typeName}`);
    }
  }

  console.log('Appointment seeding complete');
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
