import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CheckoutService } from './checkout.service';
import { CheckoutRequestDto } from './dto/checkout-request.dto';
import { CheckoutResponseDto } from './dto/checkout-response.dto';
import { Public } from '../../shared/decorators/public.decorator';

@ApiTags('checkout')
@Controller('checkout')
export class CheckoutController {
  private readonly logger = new Logger(CheckoutController.name);

  constructor(private readonly checkoutService: CheckoutService) {}

  @Post()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Public checkout endpoint for guest and authenticated users',
    description:
      'Handles complete checkout flow: user/customer creation, order creation, payment initiation, and Xendit invoice generation. ' +
      'Guest users will be automatically created with null password and can set password later via forgot password flow.',
  })
  @ApiResponse({
    status: 200,
    description: 'Checkout successful, returns payment URL and order details',
    type: CheckoutResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation errors or business logic errors',
  })
  @ApiResponse({
    status: 503,
    description:
      'Service unavailable - Xendit not configured or payment gateway error',
  })
  async checkout(
    @Body() checkoutData: CheckoutRequestDto,
  ): Promise<CheckoutResponseDto> {
    this.logger.log(
      `Checkout request received for email: ${checkoutData.email}`,
    );
    return this.checkoutService.checkout(checkoutData);
  }
}
