
function Cards(props){
    return(
        <div className ="Card">
            <h2 className = "card-text">
                {props.text}
            </h2>
            <p className = "card-num">
                {props.num}
            </p>
        </div>
    );

}

export default Cards