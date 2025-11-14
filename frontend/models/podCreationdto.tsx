class PodCreateDTO {
    name: string;
    members_to_add_by_id?: number[];

    constructor(
        name: string,
        members_to_add_by_id?: number[],
    ) {
        this.name = name;
        this.members_to_add_by_id = members_to_add_by_id;
    }
}
export default PodCreateDTO;