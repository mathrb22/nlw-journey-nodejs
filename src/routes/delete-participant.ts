import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { ClientError } from '../errors/client-error';

export async function deleteParticipant(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().delete(
		'/participants/:participantId',
		{
			schema: {
				params: z.object({
					participantId: z.string().uuid(),
				}),
			},
		},
		async (request) => {
			const { participantId } = request.params;

			const participant = await prisma.participant.findUnique({
				select: {
					id: true,
					name: true,
					email: true,
					is_confirmed: true,
				},
				where: { id: participantId },
			});

			if (!participant) {
				throw new ClientError('Participant not found');
			}

			await prisma.participant.delete({
				where: { id: participantId },
			});

			return {};
		}
	);
}
