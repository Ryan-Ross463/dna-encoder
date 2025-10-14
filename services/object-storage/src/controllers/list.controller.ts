import { Request, Response } from 'express';
import File from '../models/File';

/**
 * LIST USER FILES CONTROLLER
 * Retrieves all files owned by the authenticated user
 */
export const listUserFiles = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Get authenticated user ID
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User authentication required',
      });
      return;
    }

    // 2. Parse query parameters
    const { status, limit = '50', skip = '0' } = req.query;

    // Validate and parse limit
    let parsedLimit = parseInt(limit as string, 10);
    if (isNaN(parsedLimit) || parsedLimit < 1) {
      parsedLimit = 50;
    }
    if (parsedLimit > 100) {
      parsedLimit = 100;
    }

    // Validate and parse skip
    let parsedSkip = parseInt(skip as string, 10);
    if (isNaN(parsedSkip) || parsedSkip < 0) {
      parsedSkip = 0;
    }

    // 3. Build query filter
    const filter: any = { ownerUserId: userId };
    
    if (status && typeof status === 'string') {
      const validStatuses = ['uploaded', 'encoded', 'processing', 'failed'];
      if (validStatuses.includes(status)) {
        filter.status = status;
      }
    }

    // 4. Query database for user's files
    const files = await File.find(filter)
      .sort({ createdAt: -1 }) // Most recent first
      .skip(parsedSkip)
      .limit(parsedLimit)
      .select('-_id -__v') // Exclude MongoDB internal fields
      .lean(); // Return plain JavaScript objects

    // 5. Get total count for pagination
    const totalCount = await File.countDocuments(filter);

    console.log(`[List] Retrieved ${files.length} files for user ${userId}`);

    // 6. Return success response with files
    res.status(200).json({
      success: true,
      message: 'Files retrieved successfully',
      data: {
        files,
        pagination: {
          total: totalCount,
          limit: parsedLimit,
          skip: parsedSkip,
          hasMore: parsedSkip + files.length < totalCount,
        },
      },
    });
  } catch (error) {
    console.error('[List] Error:', error);
    res.status(500).json({
      success: false,
      error: 'List failed',
      message: 'An error occurred while retrieving files',
    });
  }
};
