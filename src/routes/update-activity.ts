import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { dayjs } from '../lib/dayjs';
import { ClientError } from '../errors/client-error';

export async function updateActivity(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().put(
		'/trips/:tripId/activities/:activityId',
		{
			schema: {
				params: z.object({
					tripId: z.string().uuid(),
					activityId: z.string().uuid(),
				}),
				body: z.object({
					title: z.string().min(4),
					occurs_at: z.coerce.date(),
				}),
			},
		},
		async (request) => {
			const { tripId, activityId } = request.params;
			const { title, occurs_at } = request.body;

			const trip = await prisma.trip.findUnique({
				where: { id: tripId },
			});

			if (!trip) {
				throw new ClientError('Trip not found');
			}

			if (dayjs(occurs_at).isBefore(trip.starts_at)) {
				throw new ClientError('Invalid activity date.');
			}

			if (dayjs(occurs_at).isAfter(trip.ends_at)) {
				throw new ClientError('Invalid activity date.');
			}

			const activity = await prisma.activity.findUnique({
				where: { id: activityId },
			});

			const updatedActivity = await prisma.activity.update({
				where: { id: activityId },
				data: {
					title,
					occurs_at,
				},
			});

			return { activityId: updatedActivity.id };
		}
	);
}
