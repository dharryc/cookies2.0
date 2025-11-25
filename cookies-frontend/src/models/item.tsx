class Item {
  id: number;
  user_id: number;
  price_range_id: number;
  link: string | null;
  description: string | null;
  purchased: boolean;

  constructor(
    id: number,
    user_id: number,
    price_range_id: number,
    link: string | null,
    description: string | null,
    purchased: boolean
  ) {
    this.id = id;
    this.user_id = user_id;
    this.price_range_id = price_range_id;
    this.link = link;
    this.description = description;
    this.purchased = purchased;
  }
}

export default Item;