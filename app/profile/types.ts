export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  avatarImageUrl?: string | null;
}

export interface OrderItemSummary {
  price: number;
  quantity: number;
}

export interface UserOrder {
  id: string;
  updatedAt: Date;
  items: OrderItemSummary[];
}
