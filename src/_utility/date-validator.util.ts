export const isNotValidDate = (date: any) => {
    
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const requestDate = new Date(date);
    requestDate.setHours(0,0,0,0);

    if(today > requestDate) {
        return true;
    }

    return false;

}